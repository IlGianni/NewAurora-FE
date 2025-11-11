import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/react";

/**
 * Hook personalizzato per gestire il logout dell'utente
 * Include pulizia completa di localStorage, sessionStorage e stato dell'applicazione
 */
export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  /**
   * Pulisce tutti i dati salvati localmente
   */
  const cleanupLocalState = () => {
    try {
      // Pulisci localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("account");
      localStorage.removeItem("session");
      localStorage.removeItem("github_token");
      localStorage.removeItem("github_user");
      // Mantieni il tema salvato (project-manager-theme) per l'utente
      // localStorage.removeItem("project-manager-theme"); // Opzionale: rimuovi se vuoi resettare anche il tema
    } catch (e) {
      console.warn("Errore pulizia localStorage:", e);
    }

    try {
      // Pulisci sessionStorage
      sessionStorage.clear();
    } catch (e) {
      console.warn("Errore pulizia sessionStorage:", e);
    }
  };

  /**
   * Esegue il logout chiamando l'endpoint backend e pulendo lo stato locale
   */
  const logout = async () => {
    setIsLoggingOut(true);

    try {
      // Chiama endpoint logout
      await axios.post(
        "/authentication/POST/logout",
        {},
        { withCredentials: true }
      );

      // Pulisci stato locale
      cleanupLocalState();

      // Emetti evento per notificare altri componenti
      window.dispatchEvent(new Event("user-logout"));

      // Mostra messaggio di successo
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Logout effettuato",
        description: "Sei stato disconnesso con successo",
        color: "success",
      });

      // Reindirizza alla pagina di login
      navigate("/");
    } catch (error: any) {
      console.error("Errore durante il logout:", error);

      // Pulisci comunque il frontend anche se il backend fallisce
      cleanupLocalState();
      window.dispatchEvent(new Event("user-logout"));

      // Mostra messaggio all'utente
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Logout completato",
        description: "Sei stato disconnesso. Se si verifica un errore, contatta il supporto.",
        color: "warning",
      });

      // Reindirizza alla pagina di login
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
}

