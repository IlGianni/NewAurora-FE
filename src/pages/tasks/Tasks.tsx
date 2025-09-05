import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function Tasks() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Task</h1>
        <p className="text-default-500 mt-2">Gestisci le tue attività</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon icon="solar:checklist-minimalistic-outline" className="text-primary text-2xl" />
            <h3 className="text-lg font-semibold">Pagina Task</h3>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-default-500">
            Questa è una pagina placeholder per le task. Qui potrai gestire tutte le tue attività.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}