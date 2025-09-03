import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HeroUIProvider>
      <ToastProvider placement="top-right" toastOffset={5} />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HeroUIProvider>
  </StrictMode>
);
