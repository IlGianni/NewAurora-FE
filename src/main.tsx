import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./contexts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <HeroUIProvider>
        <ToastProvider placement="top-right" toastOffset={5} />
        <BrowserRouter>
          <main className="text-foreground bg-background">
            <App />
          </main>
        </BrowserRouter>
      </HeroUIProvider>
    </ThemeProvider>
  </StrictMode>
);
