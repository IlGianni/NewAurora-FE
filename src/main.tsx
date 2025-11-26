import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { HeroUIProvider, ToastProvider } from "@heroui/react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./contexts";
import { AuroraProvider } from "@spacedesignitalia/react-library";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuroraProvider
      licenseKey="ChiaveDiLicenza"
      projectToken="c5f88382-d5c1-4404-8e93-8915f2851556"
    >
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
    </AuroraProvider>
  </StrictMode>
);
