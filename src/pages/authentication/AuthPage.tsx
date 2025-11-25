"use client";

import React from "react";
import {
  Button,
  Input,
  Checkbox,
  Link,
  Form,
  Divider,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [isLoginMode, setIsLoginMode] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = React.useState(false);
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    name: "",
    surname: "",
    company_id: "",
    confirm_password: "",
  });
  const [oauthProvider, setOauthProvider] = React.useState<string | null>(null);

  // Leggi parametri URL per precompilare form OAuth
  React.useEffect(() => {
    const registerParam = searchParams.get("register");
    if (registerParam === "true") {
      // Passa alla modalità registrazione
      setIsLoginMode(false);

      // Precompila i campi con i dati OAuth
      const email = searchParams.get("email") || "";
      const name = searchParams.get("name") || "";
      const surname = searchParams.get("surname") || "";
      const provider = searchParams.get("provider") || null;

      setFormData((prev) => ({
        ...prev,
        email,
        name,
        surname,
      }));

      setOauthProvider(provider);

      // Pulisci URL dai parametri
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

  const toggleVisibility = () => setIsVisible(!isVisible);
  const toggleConfirmVisibility = () => setIsConfirmVisible(!isConfirmVisible);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoginMode) {
      // Login
      const loginData = {
        email: formData.email,
        password: formData.password,
      };

      await axios
        .post("/authentication/POST/login", { login_data: loginData })
        .then((res) => {
          if (res.status === 200) {
            addToast({
              timeout: 3000,
              shouldShowTimeoutProgress: true,
              title: "Login effettuato con successo!",
              description: "Sarai reindirizzato alla dashboard...",
              color: "success",
            });
            location.href = "/dashboard";
          } else {
            addToast({
              timeout: 3000,
              shouldShowTimeoutProgress: true,
              title: "Errore durante il login",
              description: "Controlla i dati inseriti e riprova",
              color: "danger",
            });
          }
        })
        .catch((err) => {
          console.error(err);
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante il login",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        });
    } else {
      // Signup
      // Valida password solo se non è registrazione OAuth
      if (!oauthProvider) {
        if (formData.password !== formData.confirm_password) {
          console.log("Password mismatch");
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Le password non coincidono!",
            description: "Controlla le password inserite",
            color: "danger",
          });
          return;
        }

        if (!formData.password || formData.password.length < 6) {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Password troppo corta",
            description: "La password deve essere di almeno 6 caratteri",
            color: "danger",
          });
          return;
        }
      }

      // Prepara dati registrazione
      const signupData: any = {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        company_id: parseInt(formData.company_id),
      };

      // Se è una registrazione OAuth, NON inviare password
      if (oauthProvider) {
        const oauthPendingData = sessionStorage.getItem("oauth_pending_data");
        if (oauthPendingData) {
          try {
            const oauthData = JSON.parse(oauthPendingData);
            signupData.oauth_provider = oauthProvider;
            signupData.oauth_id = oauthData.oauth_id;
            signupData.oauth_access_token = oauthData.access_token; // Se necessario
          } catch (e) {
            console.warn("Errore nel parsing dati OAuth:", e);
          }
        }
      } else {
        // Solo per registrazione normale, aggiungi password
        signupData.password = formData.password;
      }

      await axios
        .post("/authentication/POST/register", { register_data: signupData })
        .then((res) => {
          if (res.status === 200) {
            // Pulisci dati OAuth pendenti
            sessionStorage.removeItem("oauth_pending_data");
            setOauthProvider(null);

            addToast({
              timeout: 3000,
              shouldShowTimeoutProgress: true,
              title: "Registrazione effettuata con successo!",
              description: oauthProvider
                ? "Account creato e collegato con " +
                  (oauthProvider === "google" ? "Google" : "GitHub")
                : "Controlla la tua email per l'attivazione del tuo account",
              color: "success",
            });

            // Se OAuth, trigger evento login
            if (oauthProvider) {
              window.dispatchEvent(new Event("user-login"));
            }

            location.href = "/dashboard";
          } else {
            addToast({
              timeout: 3000,
              shouldShowTimeoutProgress: true,
              title: "Errore durante la registrazione",
              description: "Controlla i dati inseriti e riprova",
              color: "danger",
            });
          }
        })
        .catch((err) => {
          console.error(err);
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante la registrazione",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        });
    }
  };

  const switchMode = () => {
    setIsLoginMode(!isLoginMode);
    setIsVisible(false);
    setIsConfirmVisible(false);
  };

  // Handler per login con Google
  const handleGoogleLogin = async () => {
    try {
      // Salva l'URL corrente per il redirect dopo il callback
      const currentPath = window.location.pathname;
      sessionStorage.setItem("oauth_return_url", currentPath);
      sessionStorage.setItem("oauth_provider", "google");

      // Chiama l'endpoint backend per ottenere l'URL OAuth Google
      const response = await axios.get("/authentication/GET/google-oauth", {
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: (status) => status < 400,
      });

      let googleOAuthUrl: string | null = null;

      // Cerca l'URL in vari formati possibili
      if (response.data?.url) {
        googleOAuthUrl = response.data.url;
      } else if (response.data?.oauth_url) {
        googleOAuthUrl = response.data.oauth_url;
      } else if (response.data?.google_url) {
        googleOAuthUrl = response.data.google_url;
      } else if (
        typeof response.data === "string" &&
        response.data.startsWith("http")
      ) {
        googleOAuthUrl = response.data;
      }

      // Salva state per validazione CSRF (se presente)
      if (response.data?.state) {
        sessionStorage.setItem("oauth_state", response.data.state);
      }

      if (googleOAuthUrl && googleOAuthUrl.startsWith("http")) {
        // Redirect all'URL Google OAuth
        window.location.href = googleOAuthUrl;
      } else {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore",
          description: "Impossibile ottenere l'URL di autenticazione Google",
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Errore durante il login con Google:", error);

      // Mostra messaggio di errore più dettagliato
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Impossibile avviare l'autenticazione Google";

      addToast({
        timeout: 5000,
        shouldShowTimeoutProgress: true,
        title: "Errore Autenticazione Google",
        description:
          errorMessage +
          (error.response?.status ? ` (${error.response.status})` : ""),
        color: "danger",
      });

      // Log dettagliato per debugging
      if (error.response) {
        console.error("Dettagli errore backend:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      }
    }
  };

  // Handler per login con GitHub
  const handleGitHubLogin = async () => {
    try {
      // Salva l'URL corrente per il redirect dopo il callback
      const currentPath = window.location.pathname;
      sessionStorage.setItem("oauth_return_url", currentPath);
      sessionStorage.setItem("oauth_provider", "github");

      // Chiama l'endpoint backend per ottenere l'URL OAuth GitHub
      const response = await axios.get("/authentication/GET/github-oauth", {
        withCredentials: true,
        maxRedirects: 0,
        validateStatus: (status) => status < 400,
      });

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
        sessionStorage.setItem("oauth_state", response.data.state);
      }

      if (githubOAuthUrl && githubOAuthUrl.startsWith("http")) {
        // Redirect all'URL GitHub OAuth
        window.location.href = githubOAuthUrl;
      } else {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore",
          description: "Impossibile ottenere l'URL di autenticazione GitHub",
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Errore durante il login con GitHub:", error);

      // Mostra messaggio di errore più dettagliato
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Impossibile avviare l'autenticazione GitHub";

      addToast({
        timeout: 5000,
        shouldShowTimeoutProgress: true,
        title: "Errore Autenticazione GitHub",
        description:
          errorMessage +
          (error.response?.status ? ` (${error.response.status})` : ""),
        color: "danger",
      });

      // Log dettagliato per debugging
      if (error.response) {
        console.error("Dettagli errore backend:", {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
        });
      }
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="relative overflow-hidden rounded-large bg-content1 shadow-large flex w-full max-w-md flex-col gap-4 px-8 pt-6 pb-10">
        {/* Container per l'animazione */}
        <div className="relative overflow-hidden">
          {/* Login Form */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              isLoginMode
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
            }`}
          >
            <div className="flex flex-col gap-1">
              <h1 className="text-large font-medium">Accedi al tuo account</h1>
              <p className="text-small text-default-500">
                per continuare su NewAurora
              </p>
            </div>

            <Form
              className="flex flex-col gap-3 mt-4"
              validationBehavior="native"
              onSubmit={handleSubmit}
            >
              <Input
                isRequired
                label="Indirizzo Email"
                name="email"
                placeholder="esempio@email.com"
                type="email"
                variant="bordered"
                value={formData.email}
                onChange={handleInputChange}
              />
              <Input
                isRequired
                endContent={
                  <button type="button" onClick={toggleVisibility}>
                    {isVisible ? (
                      <Icon
                        className="text-default-400 text-2xl cursor-pointer"
                        icon="solar:eye-closed-linear"
                      />
                    ) : (
                      <Icon
                        className="text-default-400 text-2xl cursor-pointer"
                        icon="solar:eye-bold"
                      />
                    )}
                  </button>
                }
                label="Password"
                name="password"
                placeholder="********"
                type={isVisible ? "text" : "password"}
                variant="bordered"
                value={formData.password}
                onChange={handleInputChange}
              />
              <div className="flex w-full items-center justify-between px-1 py-2">
                <Checkbox name="remember" size="sm">
                  Ricordami
                </Checkbox>
                <Link
                  className="text-default-500"
                  href="/forgot-password"
                  size="sm"
                >
                  Password dimenticata?
                </Link>
              </div>
              <Button
                className="w-full"
                color="primary"
                variant="solid"
                type="submit"
              >
                Accedi
              </Button>
            </Form>
          </div>

          {/* SignUp Form */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              !isLoginMode
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            }`}
          >
            <div className="flex flex-col gap-1">
              <h1 className="text-large font-medium">Crea un account</h1>
              <p className="text-small text-default-500">
                per iniziare con NewAurora
              </p>
            </div>

            <Form
              className="flex flex-col gap-3 mt-4"
              validationBehavior="native"
              onSubmit={handleSubmit}
            >
              <Input
                isRequired
                label="Nome"
                name="name"
                placeholder="Inserisci il tuo nome"
                type="text"
                variant="bordered"
                value={formData.name}
                onChange={handleInputChange}
                className={`transition-all duration-500 ease-in-out ${
                  isLoginMode
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
              />
              <Input
                isRequired
                label="Cognome"
                name="surname"
                placeholder="Inserisci il tuo cognome"
                type="text"
                variant="bordered"
                value={formData.surname}
                onChange={handleInputChange}
                className={`transition-all duration-500 ease-in-out ${
                  isLoginMode
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
              />
              <Input
                isRequired
                label="Indirizzo Email"
                name="email"
                placeholder="Inserisci la tua email"
                type="email"
                variant="bordered"
                value={formData.email}
                onChange={handleInputChange}
                isReadOnly={!!oauthProvider}
                className={oauthProvider ? "opacity-75" : ""}
                description={
                  oauthProvider
                    ? "Email da " +
                      (oauthProvider === "google" ? "Google" : "GitHub")
                    : undefined
                }
              />
              <Input
                isRequired
                label="ID Azienda"
                name="company_id"
                placeholder="Inserisci l'ID della tua azienda"
                type="number"
                variant="bordered"
                value={formData.company_id}
                onChange={handleInputChange}
                className={`transition-all duration-500 ease-in-out ${
                  isLoginMode
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
              />
              {!oauthProvider && (
                <Input
                  isRequired
                  endContent={
                    <button type="button" onClick={toggleVisibility}>
                      {isVisible ? (
                        <Icon
                          className="text-default-400 text-2xl cursor-pointer"
                          icon="solar:eye-closed-linear"
                        />
                      ) : (
                        <Icon
                          className="text-default-400 text-2xl cursor-pointer"
                          icon="solar:eye-bold"
                        />
                      )}
                    </button>
                  }
                  label="Password"
                  name="password"
                  placeholder="Inserisci la tua password"
                  type={isVisible ? "text" : "password"}
                  variant="bordered"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              )}
              {!oauthProvider && (
                <Input
                  isRequired
                  endContent={
                    <button type="button" onClick={toggleConfirmVisibility}>
                      {isConfirmVisible ? (
                        <Icon
                          className="text-default-400 text-2xl cursor-pointer"
                          icon="solar:eye-closed-linear"
                        />
                      ) : (
                        <Icon
                          className="text-default-400 text-2xl cursor-pointer"
                          icon="solar:eye-bold"
                        />
                      )}
                    </button>
                  }
                  label="Conferma Password"
                  name="confirm_password"
                  placeholder="Conferma la tua password"
                  type={isConfirmVisible ? "text" : "password"}
                  variant="bordered"
                  value={formData.confirm_password}
                  onChange={handleInputChange}
                  className={`transition-all duration-500 ease-in-out ${
                    isLoginMode
                      ? "translate-x-full opacity-0"
                      : "translate-x-0 opacity-100"
                  }`}
                />
              )}
              {oauthProvider && (
                <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <Icon
                    icon="solar:info-circle-bold"
                    className="text-primary text-xl flex-shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <p className="text-small font-medium text-primary">
                      Account OAuth
                    </p>
                    <p className="text-tiny text-default-600 mt-1">
                      Non è necessaria una password. L'autenticazione è gestita
                      da {oauthProvider === "google" ? "Google" : "GitHub"}.
                      Puoi aggiungere una password opzionale dopo la
                      registrazione nelle impostazioni.
                    </p>
                  </div>
                </div>
              )}
              <Checkbox
                isRequired
                className={`py-4 transition-all duration-500 ease-in-out ${
                  isLoginMode
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
                size="sm"
              >
                Accetto i&nbsp;
                <Link className="relative z-1" href="#" size="sm">
                  Termini
                </Link>
                &nbsp;e la&nbsp;
                <Link className="relative z-1" href="#" size="sm">
                  Privacy Policy
                </Link>
              </Checkbox>
              <Button
                className={`w-full transition-all duration-500 ease-in-out ${
                  isLoginMode
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100"
                }`}
                color="primary"
                variant="solid"
                type="submit"
              >
                Registrati
              </Button>
            </Form>
          </div>
        </div>

        {/* Social Login Section */}
        <div className="flex items-center gap-4 py-2">
          <Divider className="flex-1" />
          <p className="text-tiny text-default-500 shrink-0">OPPURE</p>
          <Divider className="flex-1" />
        </div>
        <div className="flex flex-col gap-2">
          <Button
            startContent={<Icon icon="flat-color-icons:google" width={24} />}
            variant="bordered"
            onPress={handleGoogleLogin}
            className="w-full"
          >
            Continua con Google
          </Button>
          <Button
            startContent={
              <Icon className="text-default-500" icon="fe:github" width={24} />
            }
            variant="bordered"
            onPress={handleGitHubLogin}
            className="w-full"
          >
            Continua con Github
          </Button>
        </div>

        {/* Switch Mode Button */}
        <div className="text-center">
          <Button
            variant="light"
            color="primary"
            size="sm"
            onClick={switchMode}
            className="transition-all duration-300 hover:bg-primary hover:text-white"
          >
            {isLoginMode ? (
              <>
                Non hai un account?&nbsp;
                <span className="font-semibold">Registrati</span>
              </>
            ) : (
              <>
                Hai già un account?&nbsp;
                <span className="font-semibold">Accedi</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
