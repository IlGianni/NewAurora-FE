"use client";

import React from "react";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  Input,
  ScrollShadow,
  Spacer,
} from "@heroui/react";
import {Icon} from "@iconify/react";
import {useNavigate, useLocation} from "react-router-dom";

import Sidebar from "./Sidebar";
import {ProjectManagerIcon} from "./ProjectManagerIcon";
import {sectionItems} from "./sidebar-items";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({children}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Determina la chiave attiva basata sul pathname corrente
  const getActiveKey = () => {
    const pathname = location.pathname;
    
    // Mappa i pathname alle chiavi della sidebar
    if (pathname === '/' || pathname === '/dashboard') return 'dashboard';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/projects') return 'projects';
    if (pathname === '/tasks') return 'tasks';
    if (pathname === '/team') return 'team';
    if (pathname === '/calendar') return 'calendar';
    if (pathname === '/clients') return 'clients';
    if (pathname === '/invoices') return 'invoices';
    if (pathname === '/reports') return 'reports';
    
    return 'dashboard'; // fallback
  };

  const handleSidebarSelect = (key: string) => {
    navigate(key);
  };

  const handleLogout = () => {
    // Qui implementerai la logica di logout
    console.log("Logout clicked");
  };

  return (
    <div className="h-full min-h-screen flex">
      {/* Sidebar */}
      <div className="border-r-small border-divider relative flex h-full w-72 flex-col p-6">
        <div className="flex items-center gap-2 px-2">
          <div className="bg-foreground flex h-8 w-8 items-center justify-center rounded-full">
            <ProjectManagerIcon className="text-background" />
          </div>
          <span className="text-small font-bold uppercase">Project Manager</span>
        </div>

        <Spacer y={8} />

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <Avatar isBordered size="sm" src="https://i.pravatar.cc/150?u=a04258114e29026708c" />
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
          <Card className="mx-2 overflow-visible" shadow="sm">
            <CardBody className="items-center py-5 text-center">
              <h3 className="text-medium text-default-700 font-medium">
                Upgrade to Pro
                <span aria-label="rocket-emoji" className="ml-2" role="img">
                  🚀
                </span>
              </h3>
              <p className="text-small text-default-500 p-4">
                Ottieni 1 mese gratuito e sblocca tutte le funzionalità del piano pro.
              </p>
            </CardBody>
            <CardFooter className="absolute -bottom-8 justify-center">
              <Button className="px-10 shadow-md" color="primary" radius="full" variant="shadow">
                Upgrade
              </Button>
            </CardFooter>
          </Card>
        </ScrollShadow>

        <Spacer y={8} />

        <div className="mt-auto flex flex-col">
          <Button
            fullWidth
            className="text-default-500 data-[hover=true]:text-foreground justify-start"
            startContent={
              <Icon className="text-default-500" icon="solar:info-circle-line-duotone" width={24} />
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
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}