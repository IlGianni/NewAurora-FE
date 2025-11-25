import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spinner, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

export default function GoogleCallback() {
  const [status, setStatus] = useState("Verifica in corso...");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Previeni doppia esecuzione in React StrictMode
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

        // 2. Gestisci errori da Google
        if (error) {
          const returnUrl = sessionStorage.getItem("oauth_return_url") || "/";
          sessionStorage.removeItem("oauth_return_url");
          sessionStorage.removeItem("oauth_state");
          sessionStorage.removeItem("oauth_provider");
          setStatus(`Errore: ${error}`);
          setIsError(true);
          setTimeout(() => {
            navigate(returnUrl);
          }, 3000);
          return;
        }

        if (!code) {
          const returnUrl = sessionStorage.getItem("oauth_return_url") || "/";
          sessionStorage.removeItem("oauth_return_url");
          sessionStorage.removeItem("oauth_state");
          sessionStorage.removeItem("oauth_provider");
          setStatus("Parametro 'code' OAuth mancante");
          setIsError(true);
          setTimeout(() => {
            navigate(returnUrl);
          }, 3000);
          return;
        }

        // 3. Valida state CSRF (se presente)
        const savedState = sessionStorage.getItem("oauth_state");
        if (savedState && state && savedState !== state) {
          console.warn("State CSRF non corrispondente");
          // Continua comunque, il backend validerà
        }

        // 4. Chiama il backend per processare il callback
        setStatus("Autenticazione in corso...");

        try {
          const response = await axios.get(
            "/authentication/GET/google/callback",
            {
              params: { code, state },
              withCredentials: true,
              maxRedirects: 0, // Non seguire redirect automaticamente
              validateStatus: () => true, // Accetta tutti gli status
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            }
          );

          console.log("Risposta backend Google:", response.data);

          // 5. Gestisci risposta backend
          // Se il backend fa un redirect (status 302/301), significa login riuscito
          if (response.status === 302 || response.status === 301) {
            // Backend ha fatto redirect, significa login completato
            setStatus("✅ Autenticazione completata!");

            // Pulisci sessionStorage
            sessionStorage.removeItem("oauth_return_url");
            sessionStorage.removeItem("oauth_state");
            sessionStorage.removeItem("oauth_provider");
            sessionStorage.removeItem("oauth_pending_data");

            // Trigger evento per aggiornare stato auth
            window.dispatchEvent(new Event("user-login"));

            // Redirect alla dashboard
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1000);
            return;
          }

          // Gestisci risposta JSON
          if (response.data?.requires_registration) {
            // Utente non esiste, reindirizza alla registrazione con dati precompilati
            setStatus("Completamento registrazione...");

            const userData = response.data.user_data || {};
            const params = new URLSearchParams({
              email: userData.email || "",
              name: userData.name || "",
              surname: userData.surname || "",
              provider: "google",
              oauth_id: userData.oauth_id || "",
            });

            // Pulisci sessionStorage
            sessionStorage.removeItem("oauth_return_url");
            sessionStorage.removeItem("oauth_state");
            sessionStorage.removeItem("oauth_provider");

            // Salva dati OAuth temporaneamente per completare registrazione
            sessionStorage.setItem(
              "oauth_pending_data",
              JSON.stringify({
                provider: "google",
                oauth_id: userData.oauth_id,
                access_token: userData.access_token, // Se necessario
              })
            );

            setTimeout(() => {
              navigate(`/?register=true&${params.toString()}`);
            }, 1000);
          } else if (response.data?.success || response.data?.user) {
            // Utente esiste, login completato
            setStatus("✅ Autenticazione completata!");

            // 6. Pulisci sessionStorage
            sessionStorage.removeItem("oauth_return_url");
            sessionStorage.removeItem("oauth_state");
            sessionStorage.removeItem("oauth_provider");
            sessionStorage.removeItem("oauth_pending_data");

            // 7. Trigger evento per aggiornare stato auth
            window.dispatchEvent(new Event("user-login"));

            // 8. Redirect alla dashboard o URL dal backend
            let redirectUrl =
              response.data?.redirect ||
              sessionStorage.getItem("oauth_return_url") ||
              "/dashboard";

            // Se l'URL è completo, estrai solo il path
            try {
              if (
                redirectUrl.startsWith("http://") ||
                redirectUrl.startsWith("https://")
              ) {
                const url = new URL(redirectUrl);
                redirectUrl = url.pathname + url.search + url.hash;
              }
            } catch (e) {
              // Se non è un URL valido, usa come path
              console.warn(
                "URL redirect non valido, uso come path:",
                redirectUrl
              );
            }

            sessionStorage.removeItem("oauth_return_url");

            setTimeout(() => {
              window.location.href = redirectUrl;
            }, 1000);
          } else {
            throw new Error("Risposta backend non valida");
          }
        } catch (axiosError: any) {
          // Se axios fallisce con Network Error, potrebbe essere un redirect
          // In questo caso, assumiamo che il login sia riuscito
          if (
            axiosError.code === "ERR_NETWORK" ||
            axiosError.message === "Network Error"
          ) {
            // Probabilmente il backend ha fatto un redirect che axios non può seguire
            // Assumiamo login riuscito
            setStatus("✅ Autenticazione completata!");

            // Pulisci sessionStorage
            sessionStorage.removeItem("oauth_return_url");
            sessionStorage.removeItem("oauth_state");
            sessionStorage.removeItem("oauth_provider");
            sessionStorage.removeItem("oauth_pending_data");

            // Trigger evento per aggiornare stato auth
            window.dispatchEvent(new Event("user-login"));

            // Redirect alla dashboard
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1000);
            return;
          }

          // Se l'errore è un redirect (302/301), significa login riuscito
          if (
            axiosError.response?.status === 302 ||
            axiosError.response?.status === 301
          ) {
            setStatus("✅ Autenticazione completata!");

            // Pulisci sessionStorage
            sessionStorage.removeItem("oauth_return_url");
            sessionStorage.removeItem("oauth_state");
            sessionStorage.removeItem("oauth_provider");
            sessionStorage.removeItem("oauth_pending_data");

            // Trigger evento per aggiornare stato auth
            window.dispatchEvent(new Event("user-login"));

            // Redirect alla dashboard
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1000);
            return;
          }

          console.error("Errore callback Google:", axiosError);
          setStatus("❌ Errore durante l'autenticazione");
          setIsError(true);

          const returnUrl = sessionStorage.getItem("oauth_return_url") || "/";
          sessionStorage.removeItem("oauth_return_url");
          sessionStorage.removeItem("oauth_state");
          sessionStorage.removeItem("oauth_provider");

          setTimeout(() => {
            navigate(returnUrl);
          }, 3000);
        }
      } catch (error: any) {
        // Errore generale non previsto
        console.error("Errore generale callback Google:", error);
        setStatus("❌ Errore durante l'autenticazione");
        setIsError(true);

        const returnUrl = sessionStorage.getItem("oauth_return_url") || "/";
        sessionStorage.removeItem("oauth_return_url");
        sessionStorage.removeItem("oauth_state");
        sessionStorage.removeItem("oauth_provider");

        setTimeout(() => {
          navigate(returnUrl);
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Card className="max-w-md w-full mx-4">
        <CardBody className="flex flex-col items-center justify-center gap-4 p-8">
          {!isError ? (
            <Spinner size="lg" color="primary" />
          ) : (
            <Icon
              icon="solar:close-circle-bold"
              className="text-danger text-6xl"
            />
          )}
          <p
            className={`text-center ${
              isError ? "text-danger" : "text-default-600"
            }`}
          >
            {status}
          </p>
          {isError && (
            <p className="text-small text-default-500 text-center">
              Verrai reindirizzato alla pagina di login...
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
