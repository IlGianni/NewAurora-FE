"use client";

import React, { useState } from "react";
import { Avatar, Button, Input, ScrollShadow, Spacer } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import { ProjectManagerIcon } from "./ProjectManagerIcon";
import { sectionItems } from "./sidebar-items";
import AgentPopup, { AgentToggleButton } from "./AgentPopup/AgentPopup";

interface AppLayoutProps {
  children: React.ReactNode;
  isAuth: boolean;
}

export default function AppLayout({ children, isAuth }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isAgentFullscreen, setIsAgentFullscreen] = useState(false);

  // Determina la chiave attiva basata sul pathname corrente
  const getActiveKey = () => {
    const pathname = location.pathname;

    // Mappa i pathname alle chiavi della sidebar
    if (pathname === "/" || pathname === "/dashboard") return "dashboard";
    if (pathname === "/settings") return "settings";
    if (pathname === "/projects") return "projects";
    if (pathname === "/team") return "team";
    if (pathname === "/calendar") return "calendar";
    if (pathname === "/clients") return "clients";
    if (pathname === "/invoices") return "invoices";
    if (pathname === "/reports") return "reports";

    return "dashboard"; // fallback
  };

  const handleSidebarSelect = (
    key: string | React.SyntheticEvent<HTMLUListElement>
  ) => {
    const route =
      typeof key === "string"
        ? key
        : (key.target as HTMLElement).getAttribute("data-key") || "";
    navigate(route);
  };

  const handleLogout = () => {
    // Qui implementerai la logica di logout
    console.log("Logout clicked");
  };

  return (
    <div className="h-screen flex py-4 pl-4 relative overflow-hidden">
      {/* Sidebar */}
      <div
        className="border-r-small border border-primary/20 relative flex h-full w-72 flex-col p-6 bg-default-50 rounded-2xl overflow-hidden"
        hidden={!isAuth}
      >
        <div className="flex items-center gap-2 px-2">
          <span className="text-small font-bold uppercase">
            Space Design Aurora
          </span>
        </div>

        <Spacer y={8} />

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <Avatar
              isBordered
              size="sm"
              src="https://i.pravatar.cc/150?u=a04258114e29026708c"
            />
            <div className="flex flex-col">
              <p className="text-small text-default-600 font-medium">Utente</p>
              <p className="text-tiny text-default-400">Project Manager</p>
            </div>
          </div>
          <Input
            fullWidth
            aria-label="search"
            className="px-1"
            labelPlacement="outside"
            placeholder="Cerca..."
            startContent={
              <Icon
                className="text-default-500 [&>g]:stroke-[2px]"
                icon="solar:magnifer-linear"
                width={18}
              />
            }
          />
        </div>

        <ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
          <Sidebar
            defaultSelectedKey={getActiveKey()}
            selectedKey={getActiveKey()}
            items={sectionItems}
            onSelect={handleSidebarSelect}
          />
        </ScrollShadow>

        <Spacer y={8} />

        <div className="mt-auto flex flex-col">
          <Button
            fullWidth
            className="text-default-500 data-[hover=true]:text-foreground justify-start"
            startContent={
              <Icon
                className="text-default-500"
                icon="solar:info-circle-line-duotone"
                width={24}
              />
            }
            variant="light"
          >
            Aiuto & Informazioni
          </Button>
          <Button
            className="text-default-500 data-[hover=true]:text-foreground justify-start"
            startContent={
              <Icon
                className="text-default-500 rotate-180"
                icon="solar:minus-circle-line-duotone"
                width={24}
              />
            }
            variant="light"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col h-full overflow-y-scroll transition-all duration-300 ${
          isAgentOpen && !isAgentFullscreen ? "mr-96" : "mr-0"
        }`}
      >
        <main className={isAuth ? "flex-1 p-6" : "flex-1 bg-background"}>
          {children}
        </main>
      </div>

      {/* Agent Popup */}
      <AgentPopup
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
        isFullscreen={isAgentFullscreen}
        onFullscreenChange={setIsAgentFullscreen}
      />

      {/* Agent Toggle Button */}
      {isAuth && !isAgentOpen && (
        <AgentToggleButton onClick={() => setIsAgentOpen(true)} />
      )}
    </div>
  );
}
