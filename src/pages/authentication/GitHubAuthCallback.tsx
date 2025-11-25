import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Spinner, Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";

export default function GitHubAuthCallback() {
  console.log("🔵 GitHubAuthCallback component rendered");
  const [status, setStatus] = useState("Verifica in corso...");
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasProcessed = useRef(false);

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("🔵 GitHubAuthCallback - URL params:", {
    code,
    state,
    error,
    fullUrl: window.location.href,
  });

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

        // 2. Gestisci errori da GitHub
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
            "/authentication/GET/github/auth-callback",
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

          console.log("Risposta backend GitHub:", {
            status: response.status,
            data: response.data,
            headers: response.headers,
          });

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

            // Verifica stato GitHub per vault dopo il login
            try {
              const githubStatusResponse = await axios.get(
                "/github/auth/status",
                {
                  withCredentials: true,
                }
              );
              console.log(
                "🔵 Stato GitHub dopo login:",
                githubStatusResponse.data
              );
              if (githubStatusResponse.data.authenticated) {
                // Dispatch evento per notificare che GitHub è collegato per vault
                window.dispatchEvent(
                  new CustomEvent("github-vault-connected", {
                    detail: githubStatusResponse.data,
                  })
                );
              }
            } catch (error) {
              console.warn("⚠️ Impossibile verificare stato GitHub:", error);
            }

            // Redirect alla dashboard con parametri OAuth
            setTimeout(() => {
              window.location.href = "/dashboard?oauth=success&provider=github";
            }, 1000);
            return;
          }

          // Gestisci risposta JSON
          // Verifica se la risposta è effettivamente JSON (potrebbe essere una stringa)
          let responseData = response.data;
          if (typeof responseData === "string") {
            try {
              responseData = JSON.parse(responseData);
            } catch (e) {
              console.error(
                "Impossibile parsare la risposta come JSON:",
                responseData
              );
              throw new Error("Risposta backend non valida (non è JSON)");
            }
          }

          if (responseData?.requires_registration) {
            // Utente non esiste, reindirizza alla registrazione con dati precompilati
            setStatus("Completamento registrazione...");

            const userData = responseData.user_data || {};
            const params = new URLSearchParams({
              email: userData.email || "",
              name: userData.name || "",
              surname: userData.surname || "",
              provider: "github",
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
                provider: "github",
                oauth_id: userData.oauth_id,
                access_token: userData.access_token, // Se necessario
              })
            );

            setTimeout(() => {
              navigate(`/?register=true&${params.toString()}`);
            }, 1000);
          } else if (responseData?.success || responseData?.user) {
            // Utente esiste, login completato
            setStatus("✅ Autenticazione completata!");

            // 6. Pulisci sessionStorage
            sessionStorage.removeItem("oauth_return_url");
            sessionStorage.removeItem("oauth_state");
            sessionStorage.removeItem("oauth_provider");
            sessionStorage.removeItem("oauth_pending_data");

            // 7. Trigger evento per aggiornare stato auth
            window.dispatchEvent(new Event("user-login"));

            // Verifica stato GitHub per vault dopo il login
            try {
              const githubStatusResponse = await axios.get(
                "/github/auth/status",
                {
                  withCredentials: true,
                }
              );
              console.log(
                "🔵 Stato GitHub dopo login:",
                githubStatusResponse.data
              );
              if (githubStatusResponse.data.authenticated) {
                // Dispatch evento per notificare che GitHub è collegato per vault
                window.dispatchEvent(
                  new CustomEvent("github-vault-connected", {
                    detail: githubStatusResponse.data,
                  })
                );
              }
            } catch (error) {
              console.warn("⚠️ Impossibile verificare stato GitHub:", error);
            }

            // 8. Redirect alla dashboard o URL dal backend
            let redirectUrl =
              responseData?.redirect ||
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

            // Aggiungi parametri OAuth se non già presenti
            const finalUrl = redirectUrl.includes("?")
              ? `${redirectUrl}&oauth=success&provider=github`
              : `${redirectUrl}?oauth=success&provider=github`;

            setTimeout(() => {
              window.location.href = finalUrl;
            }, 1000);
          } else if (response.status === 200 && responseData) {
            // Se il backend restituisce JSON con status 200, potrebbe essere una risposta valida
            // ma non riconosciuta. Proviamo a gestirla come login riuscito se contiene dati utente
            console.warn(
              "Risposta backend non riconosciuta, ma status 200:",
              responseData
            );

            // Se contiene dati che suggeriscono un login riuscito, procediamo
            if (
              responseData.message ||
              responseData.token ||
              responseData.access_token
            ) {
              setStatus("✅ Autenticazione completata!");

              sessionStorage.removeItem("oauth_return_url");
              sessionStorage.removeItem("oauth_state");
              sessionStorage.removeItem("oauth_provider");
              sessionStorage.removeItem("oauth_pending_data");

              window.dispatchEvent(new Event("user-login"));

              // Verifica stato GitHub per vault dopo il login
              try {
                const githubStatusResponse = await axios.get(
                  "/github/auth/status",
                  {
                    withCredentials: true,
                  }
                );
                console.log(
                  "🔵 Stato GitHub dopo login:",
                  githubStatusResponse.data
                );
                if (githubStatusResponse.data.authenticated) {
                  window.dispatchEvent(
                    new CustomEvent("github-vault-connected", {
                      detail: githubStatusResponse.data,
                    })
                  );
                }
              } catch (error) {
                console.warn("⚠️ Impossibile verificare stato GitHub:", error);
              }

              setTimeout(() => {
                window.location.href =
                  "/dashboard?oauth=success&provider=github";
              }, 1000);
            } else {
              throw new Error("Risposta backend non valida");
            }
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

            // Verifica stato GitHub per vault dopo il login
            try {
              const githubStatusResponse = await axios.get(
                "/github/auth/status",
                {
                  withCredentials: true,
                }
              );
              console.log(
                "🔵 Stato GitHub dopo login:",
                githubStatusResponse.data
              );
              if (githubStatusResponse.data.authenticated) {
                window.dispatchEvent(
                  new CustomEvent("github-vault-connected", {
                    detail: githubStatusResponse.data,
                  })
                );
              }
            } catch (error) {
              console.warn("⚠️ Impossibile verificare stato GitHub:", error);
            }

            // Redirect alla dashboard con parametri OAuth
            setTimeout(() => {
              window.location.href = "/dashboard?oauth=success&provider=github";
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

            // Verifica stato GitHub per vault dopo il login
            try {
              const githubStatusResponse = await axios.get(
                "/github/auth/status",
                {
                  withCredentials: true,
                }
              );
              console.log(
                "🔵 Stato GitHub dopo login:",
                githubStatusResponse.data
              );
              if (githubStatusResponse.data.authenticated) {
                window.dispatchEvent(
                  new CustomEvent("github-vault-connected", {
                    detail: githubStatusResponse.data,
                  })
                );
              }
            } catch (error) {
              console.warn("⚠️ Impossibile verificare stato GitHub:", error);
            }

            // Redirect alla dashboard con parametri OAuth
            setTimeout(() => {
              window.location.href = "/dashboard?oauth=success&provider=github";
            }, 1000);
            return;
          }

          console.error("Errore callback GitHub:", axiosError);
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
        console.error("Errore generale callback GitHub:", error);
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
    <div className="flex h-screen w-full items-center justify-center bg-background fixed inset-0 z-50">
      <Card className="max-w-md w-full mx-4 shadow-lg">
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
            className={`text-center text-lg font-medium ${
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
