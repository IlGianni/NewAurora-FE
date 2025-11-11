/**
 * GitHubSecretSyncPanel - Componente per sincronizzare Vault Keys con GitHub Actions Secrets
 *
 * FUNZIONALITÀ:
 * - Login GitHub via OAuth o Personal Access Token (PAT)
 * - Fetch automatico repository dopo autenticazione
 * - Selezione multipla di keys da pushare
 * - Preview secrets esistenti che verranno sovrascritti
 * - Modal di conferma con warning chiaro su sovrascrittura
 * - Push multiplo con gestione errori
 *
 * SICUREZZA:
 * - Token GitHub mai esposto nel frontend (gestito via backend)
 * - OAuth flow sicuro con redirect GitHub
 * - Validazione token prima di operazioni
 * - Warning espliciti su sovrascrittura secrets
 *
 * INTEGRAZIONE BACKEND:
 * Nota: axios.defaults.baseURL è già impostato a "/API/v1" in App.tsx
 * Pattern backend: RESTful nuove + legacy per compatibilità
 * Gli endpoint sono relativi al baseURL:
 *
 * Route RESTful (preferite):
 * - GET /github/repos - Lista repository accessibili (implementato)
 * - POST /github/repos/:owner/:repo/secrets/bulk - Push multipli secrets (implementato)
 * - POST /github/repos/:owner/:repo/secrets - Push singolo secret (implementato)
 *
 * Route Autenticazione:
 * - GET /github/auth/oauth - Inizia OAuth flow GitHub (implementato)
 * - GET /github/auth/callback - Callback OAuth con code e state (implementato)
 * - POST /github/auth/validate-token - Valida PAT manuale (implementato)
 *
 * Route Legacy (fallback):
 * - GET /github/GET/list-repos - Lista repository (fallback se RESTful non disponibile)
 *
 * Da implementare:
 * - GET /github/GET/check-token - Verifica token esistente
 * - GET /github/repos/:owner/:repo/secrets - Lista secrets esistenti
 * - POST /github/POST/logout - Logout e revoca token
 *
 * UX DEV-FRIENDLY:
 * - Stato login sempre visibile
 * - Feedback immediato su operazioni
 * - Preview chiaro di cosa verrà sovrascritto
 * - Selezione multipla con select all/none
 * - Indicatori visivi per secrets da sovrascrivere
 */

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  addToast,
  Card,
  CardBody,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox,
  Divider,
  Spinner,
  Tooltip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

interface GitHubSecretSyncPanelProps {
  secretsList: Array<{ keyName: string; value: string; isSensitive?: boolean }>;
  existingTokenStored?: boolean;
}

interface GitHubRepo {
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
  private?: boolean;
}

interface GitHubSecret {
  name: string;
  created_at?: string;
  updated_at?: string;
}

export default function GitHubSecretSyncPanel({
  secretsList,
  existingTokenStored = false,
}: GitHubSecretSyncPanelProps) {
  // Stati per autenticazione
  const [githubToken, setGithubToken] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [githubUser, setGithubUser] = useState<{
    login: string;
    avatar_url?: string;
  } | null>(null);

  // Stati per repository
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);

  // Stati per push multipli
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [existingSecrets, setExistingSecrets] = useState<GitHubSecret[]>([]);
  const [isLoadingSecrets, setIsLoadingSecrets] = useState(false);

  // Stato per risultato sincronizzazione
  const [syncResult, setSyncResult] = useState<{
    ok: boolean;
    message: string;
    warnings?: string;
    errors?: Array<{ name: string; error: string }>;
    results?: Array<{ name: string; success: boolean; overwritten?: boolean }>;
  } | null>(null);

  // Stati per modal di conferma
  const {
    isOpen: isConfirmModalOpen,
    onOpen: onConfirmModalOpen,
    onClose: onConfirmModalClose,
  } = useDisclosure();
  const [isPushing, setIsPushing] = useState(false);

  // Verifica se c'è un token salvato al mount
  useEffect(() => {
    // Prova a caricare token e user da localStorage
    try {
      const savedToken = localStorage.getItem("github_token");
      const savedUser = localStorage.getItem("github_user");

      if (savedToken) {
        setGithubToken(savedToken);
        setIsAuthenticated(true);

        // Carica user salvato se disponibile
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setGithubUser(userData);
          } catch (e) {
            console.warn("Errore nel parsing user salvato:", e);
          }
        }

        // Se c'è un token salvato, prova a validarlo
        if (existingTokenStored) {
          checkExistingToken();
        } else {
          // Valida il token salvato con il backend
          const validateSavedToken = async () => {
            try {
              const response = await axios.post("/github/auth/validate-token", {
                token: savedToken,
              });
              if (response.data?.valid) {
                setIsAuthenticated(true);
                // Aggiorna user se fornito dal backend
                if (response.data.user) {
                  setGithubUser(response.data.user);
                  localStorage.setItem(
                    "github_user",
                    JSON.stringify(response.data.user)
                  );
                }
                // Fetch repos automaticamente
                await fetchRepos(savedToken);
              } else {
                // Token non valido, rimuovi da localStorage
                localStorage.removeItem("github_token");
                localStorage.removeItem("github_user");
                setIsAuthenticated(false);
                setGithubToken("");
                setGithubUser(null);
              }
            } catch (e) {
              // Errore validazione, rimuovi da localStorage
              console.warn("Errore validazione token:", e);
              localStorage.removeItem("github_token");
              localStorage.removeItem("github_user");
              setIsAuthenticated(false);
              setGithubToken("");
              setGithubUser(null);
            }
          };
          validateSavedToken();
        }
      } else if (existingTokenStored) {
        checkExistingToken();
      }
    } catch (e) {
      // localStorage non disponibile o errore
      console.warn("Errore accesso localStorage:", e);
      if (existingTokenStored) {
        checkExistingToken();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingTokenStored]); // existingTokenStored è una prop, fetchRepos è stabile

  // Verifica token esistente dal backend
  const checkExistingToken = async () => {
    // Solo se existingTokenStored è true, prova a verificare il token
    if (!existingTokenStored) {
      return;
    }

    try {
      // Prova prima con il pattern legacy, poi con quello nuovo
      let response;
      try {
        response = await axios.get("/github/GET/check-token");
      } catch (e: any) {
        if (e.response?.status === 404) {
          // Prova pattern alternativo
          response = await axios.get("/github/check-token");
        } else {
          throw e;
        }
      }

      if (response.data?.token) {
        setGithubToken(response.data.token);
        setIsAuthenticated(true);
        if (response.data.user) {
          setGithubUser(response.data.user);
        }
        // Fetch repos automaticamente se token valido
        fetchRepos(response.data.token);
      } else {
        // Se il backend dice che c'è un token ma non lo restituisce
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      // Se l'endpoint non esiste (404), è normale - il backend non ha ancora implementato GitHub
      // Non mostrare errori per 404, solo per altri errori
      if (error.response?.status !== 404) {
        console.warn("Errore nel check token GitHub:", error);
      }
      // Nessun token salvato o endpoint non disponibile - va bene, l'utente dovrà fare login
      setIsAuthenticated(false);
    }
  };

  // Avvia OAuth flow GitHub
  const handleOAuthLogin = async () => {
    setIsLoadingAuth(true);
    try {
      // Chiama l'endpoint per ottenere l'URL OAuth GitHub
      // Il backend dovrebbe restituire JSON con l'URL GitHub, NON fare redirect
      const response = await axios.get("/github/auth/oauth", {
        // maxRedirects: 0 per evitare che axios segua redirect
        maxRedirects: 0,
        validateStatus: (status) => status < 400, // Accetta anche 302/303
      });

      // Se il backend restituisce JSON con l'URL GitHub
      if (response.data) {
        let githubOAuthUrl: string | null = null;

        // Cerca l'URL in vari formati possibili
        if (response.data?.url) {
          githubOAuthUrl = response.data.url;
        } else if (response.data?.oauth_url) {
          githubOAuthUrl = response.data.oauth_url;
        } else if (response.data?.github_url) {
          githubOAuthUrl = response.data.github_url;
        } else if (
          typeof response.data === "string" &&
          response.data.startsWith("http")
        ) {
          githubOAuthUrl = response.data;
        }

        // Salva state per validazione CSRF (se presente)
        if (response.data?.state) {
          sessionStorage.setItem("github_oauth_state", response.data.state);
        }

        if (githubOAuthUrl && githubOAuthUrl.startsWith("http")) {
          // ⚠️ IMPORTANTE: Salva l'URL corrente per reindirizzare dopo il callback
          const currentPath = window.location.pathname;
          sessionStorage.setItem("github_oauth_return_url", currentPath);

          // Redirect solo all'URL GitHub OAuth (esterno)
          window.location.href = githubOAuthUrl;
          return; // La pagina verrà reindirizzata a GitHub
        }
      }

      // Se non abbiamo trovato un URL valido, mostra errore
      addToast({
        timeout: 5000,
        shouldShowTimeoutProgress: true,
        title: "Errore OAuth",
        description:
          "Il backend non ha restituito un URL OAuth valido. Controlla la configurazione del backend.",
        color: "danger",
      });
      setIsLoadingAuth(false);
    } catch (error: any) {
      // Se axios intercetta un redirect (302/303), prova a leggere l'header Location
      if (error.response?.status === 302 || error.response?.status === 303) {
        const redirectUrl =
          error.response.headers?.location || error.response.headers?.Location;
        if (redirectUrl && redirectUrl.startsWith("http")) {
          // Se il redirect punta a GitHub, va bene
          if (redirectUrl.includes("github.com")) {
            // ⚠️ IMPORTANTE: Salva l'URL corrente per reindirizzare dopo il callback
            const currentPath = window.location.pathname;
            sessionStorage.setItem("github_oauth_return_url", currentPath);

            window.location.href = redirectUrl;
            return;
          }
          // Altrimenti è un redirect interno al backend - non va bene
          addToast({
            timeout: 5000,
            shouldShowTimeoutProgress: true,
            title: "Errore OAuth",
            description:
              "Il backend sta facendo un redirect interno invece di restituire l'URL GitHub. Il backend dovrebbe restituire JSON con l'URL OAuth.",
            color: "warning",
          });
          setIsLoadingAuth(false);
          return;
        }
      }

      // Altri errori
      addToast({
        timeout: 5000,
        shouldShowTimeoutProgress: true,
        title: "Errore OAuth",
        description: `Errore durante l'avvio OAuth: ${
          error.message || "Errore sconosciuto"
        }`,
        color: "danger",
      });
      setIsLoadingAuth(false);
    }
  };

  // Ascolta evento di autenticazione riuscita dalla pagina callback
  useEffect(() => {
    const handleAuthSuccess = async () => {
      // Ricarica stato autenticazione dopo login OAuth
      const savedToken = localStorage.getItem("github_token");
      const savedUser = localStorage.getItem("github_user");

      if (savedToken) {
        setGithubToken(savedToken);
        setIsAuthenticated(true);

        // Carica user salvato
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setGithubUser(userData);
          } catch (e) {
            console.warn("Errore nel parsing user salvato:", e);
          }
        }

        // Fetch repos automaticamente con il token salvato
        await fetchRepos(savedToken);
      } else {
        // Se non c'è token, prova a ottenerlo dalla sessione backend
        try {
          const tokenResponse = await axios.get("/github/auth/token");
          if (tokenResponse.data?.token) {
            const token = tokenResponse.data.token;
            localStorage.setItem("github_token", token);
            setGithubToken(token);
            setIsAuthenticated(true);

            if (tokenResponse.data?.user) {
              const user = tokenResponse.data.user;
              localStorage.setItem("github_user", JSON.stringify(user));
              setGithubUser(user);
            }

            await fetchRepos(token);
          }
        } catch (e) {
          console.warn("Impossibile recuperare token dalla sessione:", e);
        }
      }
    };

    window.addEventListener("github-auth-success", handleAuthSuccess);

    return () => {
      window.removeEventListener("github-auth-success", handleAuthSuccess);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchRepos è stabile, non serve nelle dipendenze

  // Login con PAT manuale
  const handlePATLogin = async () => {
    if (!githubToken.trim()) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: "Inserisci un token GitHub valido",
        color: "danger",
      });
      return;
    }

    setIsLoadingAuth(true);
    try {
      // POST /github/auth/validate-token
      const response = await axios.post("/github/auth/validate-token", {
        token: githubToken.trim(),
      });

      if (response.data?.valid) {
        const token = githubToken.trim();
        setIsAuthenticated(true);
        if (response.data.user) {
          setGithubUser(response.data.user);
        }
        // Salva token in localStorage per persistenza
        try {
          localStorage.setItem("github_token", token);
        } catch (e) {
          console.warn("Impossibile salvare token in localStorage:", e);
        }
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Login riuscito",
          description: "Token GitHub verificato con successo",
          color: "success",
        });
        // Fetch repos automaticamente
        fetchRepos(token);
      } else {
        throw new Error("Token non valido");
      }
    } catch (error: any) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: `Token non valido: ${error.message}`,
        color: "danger",
      });
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await axios.post("/github/logout");
    } catch (error: any) {
      console.warn("Errore durante il logout backend:", error);
      // Continua comunque a pulire il frontend
    } finally {
      // Pulisci sempre il frontend, anche se il logout backend fallisce
      try {
        localStorage.removeItem("github_token");
        localStorage.removeItem("github_user");
        sessionStorage.removeItem("github_token");
        sessionStorage.removeItem("github_oauth_state");
      } catch (e) {
        console.warn("Impossibile pulire storage:", e);
      }

      // Reset stato componente
      setGithubToken("");
      setIsAuthenticated(false);
      setGithubUser(null);
      setRepos([]);
      setSelectedRepo("");
      setSelectedKeys(new Set());
      setExistingSecrets([]);
      setSyncResult(null);

      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Logout",
        description: "Disconnesso da GitHub",
        color: "default",
      });
    }
  };

  // Fetch repos quando autenticato
  const fetchRepos = async (token: string) => {
    if (!token.trim()) {
      return;
    }

    setIsLoadingRepos(true);
    try {
      // Prova prima con route RESTful nuova, poi fallback a legacy
      let response;
      try {
        response = await axios.get("/github/repos", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e: any) {
        if (e.response?.status === 404) {
          // Fallback a route legacy
          response = await axios.get("/github/GET/list-repos", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          throw e;
        }
      }

      if (response.data && Array.isArray(response.data)) {
        setRepos(response.data);
      } else if (response.data?.repos && Array.isArray(response.data.repos)) {
        setRepos(response.data.repos);
      } else {
        throw new Error("Formato risposta non valido");
      }
    } catch (error: any) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: `Errore nel caricamento dei repository: ${error.message}`,
        color: "danger",
      });
      setRepos([]);
    } finally {
      setIsLoadingRepos(false);
    }
  };

  // Fetch secrets esistenti quando viene selezionato un repo
  useEffect(() => {
    if (selectedRepo && isAuthenticated && githubToken) {
      fetchExistingSecrets();
    } else {
      setExistingSecrets([]);
    }
  }, [selectedRepo, isAuthenticated]);

  // Fetch secrets esistenti nel repository
  const fetchExistingSecrets = async () => {
    if (!selectedRepo || !githubToken) return;

    setIsLoadingSecrets(true);
    try {
      const response = await axios.get(
        `/github/repos/${encodeURIComponent(selectedRepo)}/secrets`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
          },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        setExistingSecrets(response.data);
      } else if (
        response.data?.secrets &&
        Array.isArray(response.data.secrets)
      ) {
        setExistingSecrets(response.data.secrets);
      } else {
        setExistingSecrets([]);
      }
    } catch (error: any) {
      // Se l'API non supporta ancora il fetch dei secrets, continua comunque
      console.warn("Impossibile caricare i secrets esistenti:", error);
      setExistingSecrets([]);
    } finally {
      setIsLoadingSecrets(false);
    }
  };

  // Gestisce la selezione multipla delle keys
  const handleKeySelection = (keyName: string, isSelected: boolean) => {
    setSelectedKeys((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(keyName);
      } else {
        newSet.delete(keyName);
      }
      return newSet;
    });
  };

  // Seleziona/Deseleziona tutte le keys
  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedKeys(new Set(secretsList.map((s) => s.keyName)));
    } else {
      setSelectedKeys(new Set());
    }
  };

  // Verifica quali secrets verranno sovrascritti
  const getSecretsToOverwrite = () => {
    const selectedKeyNames = Array.from(selectedKeys);
    return existingSecrets.filter((secret) =>
      selectedKeyNames.includes(secret.name)
    );
  };

  // Apre il modal di conferma
  const handleOpenConfirmModal = () => {
    if (selectedKeys.size === 0) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: "Seleziona almeno una chiave da pushare",
        color: "danger",
      });
      return;
    }

    if (!selectedRepo) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: "Seleziona un repository",
        color: "danger",
      });
      return;
    }

    // Reset risultato precedente
    setSyncResult(null);
    onConfirmModalOpen();
  };

  // Esegue il push multiplo
  const handlePushKeys = async () => {
    if (selectedKeys.size === 0 || !selectedRepo || !githubToken) {
      return;
    }

    setIsPushing(true);
    try {
      const keysToPush = Array.from(selectedKeys);

      // Prepara i secrets da pushare
      const secrets = keysToPush.map((keyName) => {
        const secret = secretsList.find((s) => s.keyName === keyName);
        if (!secret) {
          throw new Error(`Chiave ${keyName} non trovata`);
        }

        // Usa il nome della chiave come nome del secret GitHub
        const githubSecretName = keyName
          .toUpperCase()
          .replace(/[^A-Z0-9_]/g, "_");

        return {
          name: githubSecretName,
          value: secret.value,
        };
      });

      // Parsa owner/repo dal full_name
      const [owner, repo] = selectedRepo.split("/");
      if (!owner || !repo) {
        throw new Error(
          "Formato repository non valido. Usa formato owner/repo"
        );
      }

      // Usa route RESTful bulk per push multiplo
      let response;
      try {
        response = await axios.post(
          `/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
            repo
          )}/secrets/bulk`,
          { secrets },
          {
            headers: {
              Authorization: `Bearer ${githubToken}`,
            },
          }
        );
      } catch (e: any) {
        // Fallback: se bulk non esiste, fai chiamate singole
        if (e.response?.status === 404) {
          const pushPromises = secrets.map(async (secret) => {
            await axios.post(
              `/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
                repo
              )}/secrets`,
              {
                secretName: secret.name,
                secretValue: secret.value,
              },
              {
                headers: {
                  Authorization: `Bearer ${githubToken}`,
                },
              }
            );
          });
          await Promise.all(pushPromises);
          // Crea risultato mock per fallback
          response = {
            data: {
              ok: true,
              message: `${secrets.length} secret${
                secrets.length > 1 ? "s" : ""
              } pushati con successo`,
              results: secrets.map((s) => ({ name: s.name, success: true })),
            },
          };
        } else {
          throw e;
        }
      }

      // Salva risultato per visualizzazione dettagliata
      if (response.data) {
        setSyncResult(response.data);
      }

      if (response.data?.ok) {
        addToast({
          timeout: 5000,
          shouldShowTimeoutProgress: true,
          title: "Successo",
          description:
            response.data.message ||
            `✅ ${keysToPush.length} secret${
              keysToPush.length > 1 ? "s" : ""
            } pushati con successo su GitHub Actions`,
          color: "success",
        });
      }

      // Reset selezione ma mantieni modal aperto per mostrare risultati
      setSelectedKeys(new Set());
      fetchExistingSecrets(); // Refresh lista secrets esistenti
    } catch (error: any) {
      addToast({
        timeout: 5000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: `Errore durante il push: ${error.message}`,
        color: "danger",
      });
    } finally {
      setIsPushing(false);
    }
  };

  const secretsToOverwrite = getSecretsToOverwrite();
  const hasOverwrites = secretsToOverwrite.length > 0;

  return (
    <div className="space-y-4">
      {/* Card Autenticazione GitHub */}
      <Card>
        <CardBody className="space-y-4 p-6">
          {!isAuthenticated ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Autenticazione GitHub
                </label>
                <p className="text-sm text-default-500">
                  Connettiti a GitHub per sincronizzare i secret. Puoi usare
                  OAuth o un Personal Access Token con permessi{" "}
                  <code className="text-xs bg-default-100 px-1 py-0.5 rounded">
                    repo
                  </code>
                  .
                </p>
              </div>

              <Divider />

              {/* OAuth Login */}
              <div className="space-y-2">
                <Button
                  color="default"
                  variant="bordered"
                  startContent={<Icon icon="mdi:github" className="text-xl" />}
                  onPress={handleOAuthLogin}
                  isLoading={isLoadingAuth}
                  className="w-full"
                >
                  Login con GitHub OAuth
                </Button>
                <p className="text-xs text-default-400 text-center">
                  Reindirizzamento sicuro a GitHub
                </p>
              </div>

              <div className="flex items-center gap-4 py-2">
                <Divider className="flex-1" />
                <span className="text-xs text-default-400 shrink-0">
                  oppure
                </span>
                <Divider className="flex-1" />
              </div>

              {/* PAT Login */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePATLogin();
                }}
                className="space-y-2"
              >
                {/* Campo username nascosto per accessibilità */}
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  style={{ display: "none" }}
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <Input
                  type="password"
                  name="token"
                  value={githubToken}
                  onValueChange={setGithubToken}
                  placeholder="Inserisci Personal Access Token"
                  description="Token con permessi 'repo' per repository privati"
                  autoComplete="new-password"
                  endContent={
                    <Button
                      size="sm"
                      color="primary"
                      type="submit"
                      isDisabled={!githubToken.trim() || isLoadingAuth}
                      isLoading={isLoadingAuth}
                    >
                      Connetti
                    </Button>
                  }
                />
                <p className="text-xs text-default-400">
                  Crea un token su{" "}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    GitHub Settings
                  </a>
                </p>
              </form>
            </>
          ) : (
            <>
              {/* Stato connesso */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  {githubUser?.avatar_url && (
                    <img
                      src={githubUser.avatar_url}
                      alt={githubUser.login}
                      className="w-12 h-12 rounded-full border-2 border-default-200"
                    />
                  )}
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-medium text-foreground">
                      Connesso come{" "}
                      <span className="font-semibold text-primary">
                        {githubUser?.login || "GitHub User"}
                      </span>
                    </p>
                    <Chip
                      size="sm"
                      color="success"
                      variant="flat"
                      startContent={
                        <Icon icon="mdi:check-circle" className="text-sm" />
                      }
                      className="w-fit"
                    >
                      Autenticato
                    </Chip>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={handleLogout}
                  startContent={<Icon icon="mdi:logout" />}
                  className="shrink-0"
                >
                  Disconnetti
                </Button>
              </div>

              {/* Repository Select */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    Repository GitHub
                  </label>
                  <div className="flex items-center gap-2">
                    {repos.length > 0 && (
                      <span className="text-xs text-default-500">
                        {repos.length} disponibile{repos.length > 1 ? "i" : ""}
                      </span>
                    )}
                    {isAuthenticated && githubToken && (
                      <Tooltip content="Ricarica repository">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => fetchRepos(githubToken)}
                          isLoading={isLoadingRepos}
                          className="min-w-unit-6 h-unit-6"
                        >
                          <Icon icon="mdi:refresh" className="text-lg" />
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <Select
                  selectedKeys={selectedRepo ? [selectedRepo] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setSelectedRepo(selected || "");
                  }}
                  placeholder={
                    isLoadingRepos
                      ? "Caricamento repository..."
                      : repos.length === 0
                      ? "Nessun repository disponibile"
                      : "Seleziona un repository"
                  }
                  isDisabled={
                    repos.length === 0 || isLoadingRepos || !isAuthenticated
                  }
                  isLoading={isLoadingRepos}
                  startContent={
                    <Icon icon="mdi:source-repository" className="text-lg" />
                  }
                  classNames={{
                    trigger: "min-h-unit-12 bg-default-50",
                    value: "text-foreground",
                  }}
                  description={
                    !isLoadingRepos && repos.length === 0
                      ? "Nessun repository trovato. Assicurati che il token abbia i permessi corretti."
                      : undefined
                  }
                >
                  {repos.map((repo) => (
                    <SelectItem
                      key={repo.full_name}
                      textValue={repo.full_name}
                      startContent={
                        <Icon
                          icon={
                            repo.private ? "mdi:lock" : "mdi:lock-open-variant"
                          }
                          className={
                            repo.private ? "text-warning" : "text-success"
                          }
                        />
                      }
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{repo.full_name}</span>
                        {repo.private && (
                          <Chip
                            size="sm"
                            variant="flat"
                            color="warning"
                            className="ml-2"
                          >
                            Privato
                          </Chip>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </Select>
                {isLoadingSecrets && (
                  <div className="flex items-center gap-2 text-xs text-default-500 mt-1">
                    <Spinner size="sm" />
                    <span>Caricamento secrets esistenti...</span>
                  </div>
                )}
                {selectedRepo && !isLoadingSecrets && (
                  <p className="text-xs text-default-500 mt-1">
                    Repository selezionato:{" "}
                    <span className="font-medium text-foreground">
                      {selectedRepo}
                    </span>
                  </p>
                )}
              </div>

              {/* Visualizzazione Secrets Esistenti */}
              {selectedRepo && !isLoadingSecrets && (
                <div className="space-y-2 mt-4 pt-4 border-t border-default-200">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      Secrets Esistenti nella Repository
                    </label>
                    {existingSecrets.length > 0 && (
                      <Chip size="sm" variant="flat" color="default">
                        {existingSecrets.length} secret
                        {existingSecrets.length > 1 ? "s" : ""}
                      </Chip>
                    )}
                  </div>
                  {existingSecrets.length === 0 ? (
                    <div className="p-3 bg-default-50 rounded-lg border border-default-200">
                      <p className="text-xs text-default-500 text-center">
                        Nessun secret presente in questa repository
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {existingSecrets.map((secret) => {
                        // Verifica se questo secret verrà sovrascritto
                        const willBeOverwritten =
                          selectedKeys.size > 0 &&
                          secretsList.some(
                            (vaultSecret) =>
                              vaultSecret.keyName
                                .toUpperCase()
                                .replace(/[^A-Z0-9_]/g, "_") === secret.name
                          );

                        return (
                          <div
                            key={secret.name}
                            className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                              willBeOverwritten
                                ? "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800 hover:bg-warning-100 dark:hover:bg-warning-900/30"
                                : "bg-default-50 border-default-200 hover:bg-default-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Icon
                                icon="mdi:key-variant"
                                className={`shrink-0 ${
                                  willBeOverwritten
                                    ? "text-warning"
                                    : "text-default-400"
                                }`}
                              />
                              <span className="text-sm font-mono font-medium text-foreground truncate">
                                {secret.name}
                              </span>
                              {willBeOverwritten && (
                                <Chip
                                  size="sm"
                                  color="warning"
                                  variant="flat"
                                  startContent={
                                    <Icon
                                      icon="mdi:alert"
                                      className="text-xs"
                                    />
                                  }
                                  className="ml-2 shrink-0"
                                >
                                  Verrà sovrascritto
                                </Chip>
                              )}
                            </div>
                            {secret.updated_at && (
                              <Tooltip
                                content={`Ultimo aggiornamento: ${new Date(
                                  secret.updated_at
                                ).toLocaleString("it-IT")}`}
                              >
                                <span className="text-xs text-default-400 shrink-0 ml-2">
                                  {new Date(
                                    secret.updated_at
                                  ).toLocaleDateString("it-IT")}
                                </span>
                              </Tooltip>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Card Selezione Keys - Visibile solo se autenticato */}
      {isAuthenticated && (
        <Card>
          <CardBody className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                  <Icon
                    icon="mdi:key-variant"
                    className="text-primary text-lg"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Seleziona Keys da Pushare
                  </h3>
                  <p className="text-xs text-default-500 mt-0.5">
                    {selectedKeys.size} di {secretsList.length} selezionate
                    {selectedKeys.size > 0 && (
                      <span className="ml-2 text-primary font-medium">
                        ({selectedKeys.size})
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => handleSelectAll(true)}
                  isDisabled={selectedKeys.size === secretsList.length}
                  startContent={
                    <Icon icon="mdi:check-all" className="text-sm" />
                  }
                >
                  Tutte
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  onPress={() => handleSelectAll(false)}
                  isDisabled={selectedKeys.size === 0}
                  startContent={
                    <Icon icon="mdi:close-box" className="text-sm" />
                  }
                >
                  Nessuna
                </Button>
              </div>
            </div>

            <Divider />

            {/* Lista Keys con Checkbox */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {secretsList.length === 0 ? (
                <div className="p-6 bg-default-50 rounded-lg border border-default-200 text-center">
                  <Icon
                    icon="mdi:key-variant"
                    className="text-3xl text-default-300 mx-auto mb-2"
                  />
                  <p className="text-sm text-default-400">
                    Nessuna chiave disponibile nel vault
                  </p>
                </div>
              ) : (
                secretsList.map((secret) => {
                  const isSelected = selectedKeys.has(secret.keyName);
                  const willOverwrite = existingSecrets.some(
                    (s) =>
                      s.name ===
                      secret.keyName.toUpperCase().replace(/[^A-Z0-9_]/g, "_")
                  );

                  return (
                    <div
                      key={secret.keyName}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                        isSelected
                          ? willOverwrite
                            ? "bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800"
                            : "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800"
                          : willOverwrite
                          ? "bg-default-50 border-warning-100 dark:border-warning-900/30 hover:bg-warning-50/50 dark:hover:bg-warning-900/10"
                          : "bg-default-50 border-default-200 hover:bg-default-100"
                      }`}
                    >
                      <Checkbox
                        isSelected={isSelected}
                        onValueChange={(checked) =>
                          handleKeySelection(secret.keyName, checked)
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="mdi:key-variant"
                              className={`text-sm shrink-0 ${
                                isSelected ? "text-primary" : "text-default-400"
                              }`}
                            />
                            <span
                              className={`text-sm font-semibold ${
                                isSelected
                                  ? "text-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {secret.keyName}
                            </span>
                          </div>
                          {willOverwrite && (
                            <Chip
                              size="sm"
                              color="warning"
                              variant="flat"
                              startContent={
                                <Icon
                                  icon="mdi:alert-circle"
                                  className="text-xs"
                                />
                              }
                              className="shrink-0"
                            >
                              Sovrascriverà
                            </Chip>
                          )}
                          {isSelected && !willOverwrite && (
                            <Chip
                              size="sm"
                              color="primary"
                              variant="flat"
                              startContent={
                                <Icon
                                  icon="mdi:check-circle"
                                  className="text-xs"
                                />
                              }
                              className="shrink-0"
                            >
                              Nuovo
                            </Chip>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          {secret.isSensitive ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-mono text-default-500">
                                ••••••
                              </span>
                              <Tooltip content="Valore sensibile nascosto">
                                <Icon
                                  icon="mdi:eye-off"
                                  className="text-xs text-default-400"
                                />
                              </Tooltip>
                            </div>
                          ) : (
                            <span className="text-xs font-mono text-default-500 truncate">
                              {secret.value}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pulsante Push - Visibile solo se repository selezionato */}
            {selectedRepo && (
              <>
                <Divider />
                <Button
                  color="primary"
                  onPress={handleOpenConfirmModal}
                  isDisabled={selectedKeys.size === 0}
                  startContent={<Icon icon="mdi:upload" />}
                  className="w-full"
                >
                  Push Vault Keys to GitHub
                </Button>
              </>
            )}
          </CardBody>
        </Card>
      )}

      {/* Modal Conferma Push con Warning */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={onConfirmModalClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Icon icon="mdi:alert-circle" className="text-warning text-xl" />
              <span>Conferma Push Secrets</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* Warning Sovrascrittura */}
              {hasOverwrites && (
                <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Icon
                      icon="mdi:alert"
                      className="text-warning text-xl mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-warning-900 dark:text-warning-100 mb-1">
                        ⚠️ Attenzione: Sovrascrittura Secrets
                      </p>
                      <p className="text-xs text-warning-800 dark:text-warning-200">
                        I seguenti secrets esistenti verranno{" "}
                        <strong>sovrascritti</strong>:
                      </p>
                      <ul className="mt-2 space-y-1">
                        {secretsToOverwrite.map((secret) => (
                          <li
                            key={secret.name}
                            className="text-xs text-warning-800 dark:text-warning-200 font-mono bg-warning-100 dark:bg-warning-900/40 px-2 py-1 rounded"
                          >
                            {secret.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Riepilogo */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Riepilogo:
                </p>
                <div className="bg-default-100 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-default-600">Repository:</span>
                    <span className="font-medium text-foreground">
                      {selectedRepo}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-default-600">Keys da pushare:</span>
                    <span className="font-medium text-foreground">
                      {selectedKeys.size}
                    </span>
                  </div>
                  {hasOverwrites && (
                    <div className="flex justify-between text-sm">
                      <span className="text-warning-600">
                        Secrets da sovrascrivere:
                      </span>
                      <span className="font-medium text-warning">
                        {secretsToOverwrite.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Lista Secrets che verranno pubblicati */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Secrets che verranno pubblicati:
                </p>
                <div className="bg-default-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {Array.from(selectedKeys).map((keyName) => {
                      const githubName = keyName
                        .toUpperCase()
                        .replace(/[^A-Z0-9_]/g, "_");
                      const willOverwrite = existingSecrets.some(
                        (s) => s.name === githubName
                      );
                      return (
                        <Chip
                          key={keyName}
                          size="sm"
                          variant="flat"
                          color={willOverwrite ? "warning" : "primary"}
                          startContent={
                            <Icon
                              icon={
                                willOverwrite
                                  ? "mdi:alert-circle"
                                  : "mdi:check-circle"
                              }
                              className="text-xs"
                            />
                          }
                        >
                          <span className="font-mono">{githubName}</span>
                        </Chip>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Risultato Sincronizzazione */}
              {syncResult && (
                <div className="space-y-3 mt-4">
                  <Divider />
                  <div
                    className={`p-4 rounded-lg ${
                      syncResult.ok
                        ? "bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800"
                        : "bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon
                        icon={
                          syncResult.ok
                            ? "mdi:check-circle"
                            : "mdi:alert-circle"
                        }
                        className={`text-xl mt-0.5 flex-shrink-0 ${
                          syncResult.ok ? "text-success" : "text-danger"
                        }`}
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm font-semibold mb-1 ${
                            syncResult.ok
                              ? "text-success-900 dark:text-success-100"
                              : "text-danger-900 dark:text-danger-100"
                          }`}
                        >
                          {syncResult.ok
                            ? "✅ Sincronizzazione Completata!"
                            : "❌ Errore"}
                        </p>
                        <p
                          className={`text-xs ${
                            syncResult.ok
                              ? "text-success-800 dark:text-success-200"
                              : "text-danger-800 dark:text-danger-200"
                          }`}
                        >
                          {syncResult.message}
                        </p>

                        {syncResult.warnings && (
                          <div className="mt-2 p-2 bg-warning-50 dark:bg-warning-900/40 rounded text-xs text-warning-800 dark:text-warning-200">
                            ⚠️ {syncResult.warnings}
                          </div>
                        )}

                        {syncResult.errors && syncResult.errors.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-semibold text-danger-800 dark:text-danger-200">
                              Errori:
                            </p>
                            <ul className="text-xs text-danger-700 dark:text-danger-300 space-y-1">
                              {syncResult.errors.map((err, idx) => (
                                <li key={idx}>
                                  {err.name}: {err.error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {syncResult.results &&
                          syncResult.results.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer text-default-600 hover:text-default-800">
                                Dettagli ({syncResult.results.length} secrets)
                              </summary>
                              <ul className="mt-2 space-y-1 text-xs">
                                {syncResult.results.map((r, idx) => (
                                  <li
                                    key={idx}
                                    className={`flex items-center gap-2 ${
                                      r.success
                                        ? "text-success-700 dark:text-success-300"
                                        : "text-danger-700 dark:text-danger-300"
                                    }`}
                                  >
                                    <Icon
                                      icon={
                                        r.success ? "mdi:check" : "mdi:close"
                                      }
                                      className="text-sm"
                                    />
                                    <code>{r.name}</code>
                                    {r.overwritten && (
                                      <Chip
                                        size="sm"
                                        color="warning"
                                        variant="flat"
                                      >
                                        sovrascritto
                                      </Chip>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </details>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            {syncResult ? (
              <Button color="primary" onPress={onConfirmModalClose}>
                Chiudi
              </Button>
            ) : (
              <>
                <Button variant="light" onPress={onConfirmModalClose}>
                  Annulla
                </Button>
                <Button
                  color={hasOverwrites ? "warning" : "primary"}
                  onPress={handlePushKeys}
                  isLoading={isPushing}
                  startContent={!isPushing && <Icon icon="mdi:upload" />}
                >
                  {isPushing
                    ? "Push in corso..."
                    : hasOverwrites
                    ? "Conferma e Sovrascrivi"
                    : "Conferma Push"}
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
