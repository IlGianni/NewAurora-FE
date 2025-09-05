import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function Projects() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Progetti</h1>
        <p className="text-default-500 mt-2">Gestisci i tuoi progetti</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon icon="solar:widget-2-outline" className="text-primary text-2xl" />
            <h3 className="text-lg font-semibold">Pagina Progetti</h3>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-default-500">
            Questa è una pagina placeholder per i progetti. Qui potrai gestire tutti i tuoi progetti.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}