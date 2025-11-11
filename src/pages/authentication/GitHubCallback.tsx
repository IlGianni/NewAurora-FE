import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spinner, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

export default function GitHubCallback() {
  const [status, setStatus] = useState("Verifica in corso...");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // ⚠️ CRITICO: Previene doppia esecuzione in React StrictMode
  const hasProcessed = useRef(false);

  useEffect(() => {
    // ⚠️ CRITICO: Previeni doppia esecuzione (React StrictMode)
    if (hasProcessed.current) {
      console.log("Callback già processato, ignoro doppia esecuzione");
      return;
    }
    hasProcessed.current = true;

    const handleCallback = async () => {
      try {
        // 1. Estrai parametri dall'URL
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        // 2. Gestisci errori da GitHub
        if (error) {
          const returnUrl = sessionStorage.getItem("github_oauth_return_url");
          sessionStorage.removeItem("github_oauth_return_url");
          sessionStorage.removeItem("github_oauth_state");
          setStatus(`Errore: ${error}`);
          setIsError(true);
          setTimeout(() => {
            if (returnUrl && returnUrl.startsWith("/")) {
              const urlWithHash = returnUrl.includes("#")
                ? returnUrl
                : `${returnUrl}#vault`;
              navigate(urlWithHash);
            } else {
              navigate("/dashboard");
            }
          }, 3000);
          return;
        }

        if (!code) {
          const returnUrl = sessionStorage.getItem("github_oauth_return_url");
          sessionStorage.removeItem("github_oauth_return_url");
          sessionStorage.removeItem("github_oauth_state");
          setStatus("Parametro 'code' OAuth mancante");
          setIsError(true);
          setTimeout(() => {
            if (returnUrl && returnUrl.startsWith("/")) {
              const urlWithHash = returnUrl.includes("#")
                ? returnUrl
                : `${returnUrl}#vault`;
              navigate(urlWithHash);
            } else {
              navigate("/dashboard");
            }
          }, 3000);
          return;
        }

        // 3. Valida state CSRF (se presente)
        if (state) {
          const savedState = sessionStorage.getItem("github_oauth_state");
          if (savedState && state !== savedState) {
            const returnUrl = sessionStorage.getItem("github_oauth_return_url");
            sessionStorage.removeItem("github_oauth_return_url");
            sessionStorage.removeItem("github_oauth_state");
            setStatus("Errore: State mismatch (possibile attacco CSRF)");
            setIsError(true);
            setTimeout(() => {
              if (returnUrl && returnUrl.startsWith("/")) {
                const urlWithHash = returnUrl.includes("#")
                  ? returnUrl
                  : `${returnUrl}#vault`;
                navigate(urlWithHash);
              } else {
                navigate("/dashboard");
              }
            }, 3000);
            return;
          }
        }

        // 4. Scambia code con token chiamando il backend
        // ⚠️ IMPORTANTE: Chiama solo UNA volta (il codice può essere usato solo una volta)
        setStatus("Autenticazione in corso...");
        const response = await axios.get("/github/auth/callback", {
          params: { code, state },
        });

        if (response.data?.success || response.data?.token) {
          setStatus("✅ Autenticazione completata!");

          let tokenToSave = response.data.token;
          let userToSave = response.data.user;

          // ⚠️ IMPORTANTE: Se il backend non restituisce il token, prova a ottenerlo dalla sessione
          if (!tokenToSave) {
            try {
              setStatus("Recupero token dalla sessione...");
              const tokenResponse = await axios.get("/github/auth/token");
              if (tokenResponse.data?.token) {
                tokenToSave = tokenResponse.data.token;
              }
              if (tokenResponse.data?.user && !userToSave) {
                userToSave = tokenResponse.data.user;
              }
            } catch (e: any) {
              console.warn("Impossibile recuperare token dalla sessione:", e);
              // Continua comunque, potrebbe essere salvato in sessione backend
            }
          }

          // 5. Salva token e user in localStorage
          if (tokenToSave) {
            try {
              localStorage.setItem("github_token", tokenToSave);
            } catch (e) {
              console.warn("Impossibile salvare token in localStorage:", e);
            }
          } else {
            console.warn(
              "⚠️ Token non disponibile. Il backend potrebbe usare solo sessione."
            );
          }

          if (userToSave) {
            try {
              localStorage.setItem("github_user", JSON.stringify(userToSave));
            } catch (e) {
              console.warn("Impossibile salvare user in localStorage:", e);
            }
          }

          // 6. Pulisci state
          sessionStorage.removeItem("github_oauth_state");

          // 7. Trigger evento per aggiornare stato auth in altri componenti
          window.dispatchEvent(new Event("github-auth-success"));

          // 8. Redirect all'URL salvato prima del login OAuth, o alla dashboard
          const returnUrl = sessionStorage.getItem("github_oauth_return_url");
          sessionStorage.removeItem("github_oauth_return_url");

          // ⚠️ IMPORTANTE: Salva flag per aprire modal GitHub dopo redirect
          sessionStorage.setItem("github_open_modal", "true");

          setTimeout(() => {
            // Se c'è un URL salvato (es. /projects/:id), reindirizza lì con hash per tab vault
            // Altrimenti reindirizza alla dashboard
            if (returnUrl && returnUrl.startsWith("/")) {
              // Aggiungi hash per tab vault se non presente
              const urlWithHash = returnUrl.includes("#")
                ? returnUrl
                : `${returnUrl}#vault`;
              navigate(urlWithHash);
            } else {
              navigate("/dashboard");
            }
          }, 1500);
        } else {
          throw new Error("Risposta backend non valida");
        }
      } catch (error: any) {
        console.error("Errore callback:", error);
        const errorData = error.response?.data;
        const errorMessage =
          errorData?.message || error.message || "Errore sconosciuto";

        // Gestione errori specifici per codice scaduto/già usato
        const returnUrl = sessionStorage.getItem("github_oauth_return_url");
        sessionStorage.removeItem("github_oauth_return_url");
        sessionStorage.removeItem("github_oauth_state");

        if (
          errorMessage.includes("expired") ||
          errorMessage.includes("incorrect") ||
          errorMessage.includes("scaduto") ||
          errorMessage.includes("già utilizzato")
        ) {
          setStatus(
            "⚠️ Codice OAuth scaduto o già utilizzato. Il codice può essere usato solo una volta. Riprova il login."
          );
          setIsError(true);
          // Reindirizza all'URL salvato o alla dashboard
          setTimeout(() => {
            if (returnUrl && returnUrl.startsWith("/")) {
              const urlWithHash = returnUrl.includes("#")
                ? returnUrl
                : `${returnUrl}#vault`;
              navigate(urlWithHash);
            } else {
              navigate("/dashboard");
            }
          }, 5000);
        } else {
          setStatus(`Errore: ${errorMessage}`);
          setIsError(true);
          // Reindirizza all'URL salvato o alla dashboard
          setTimeout(() => {
            if (returnUrl && returnUrl.startsWith("/")) {
              const urlWithHash = returnUrl.includes("#")
                ? returnUrl
                : `${returnUrl}#vault`;
              navigate(urlWithHash);
            } else {
              navigate("/dashboard");
            }
          }, 3000);
        }
      }
    };

    handleCallback();
    // ⚠️ Array vuoto per eseguire solo al mount (non dipendere da searchParams per evitare re-esecuzioni)
    // navigate è stabile, searchParams viene letto solo una volta all'inizio
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dipendenze vuote - esegue solo al mount, hasProcessed previene doppie esecuzioni

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardBody className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <Icon
              icon="mdi:github"
              className={`text-4xl ${isError ? "text-danger" : "text-primary"}`}
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Autenticazione GitHub
          </h1>
          <div className="flex items-center justify-center gap-3">
            {!isError && status.includes("in corso") && (
              <Spinner size="sm" color="primary" />
            )}
            <p
              className={`text-lg ${
                isError ? "text-danger" : "text-foreground"
              }`}
            >
              {status}
            </p>
          </div>
          {isError && (
            <p className="text-sm text-default-500">
              Verrai reindirizzato alla dashboard...
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
