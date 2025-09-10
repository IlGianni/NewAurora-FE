import React, { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Skeleton } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function Tasks() {
  const [isLoading, setIsLoading] = useState(true);

  // Simula il caricamento dei dati
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <>
          {/* Header skeleton */}
          <div>
            <Skeleton className="h-9 w-32 rounded mb-2" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>

          {/* Card skeleton */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="flex rounded w-8 h-8" />
                <Skeleton className="h-6 w-32 rounded" />
              </div>
            </CardHeader>
            <CardBody>
              <Skeleton className="h-4 w-full rounded mb-2" />
              <Skeleton className="h-4 w-3/4 rounded" />
            </CardBody>
          </Card>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Task</h1>
            <p className="text-default-500 mt-2">Gestisci le tue attività</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Icon
                  icon="solar:checklist-minimalistic-outline"
                  className="text-primary text-2xl"
                />
                <h3 className="text-lg font-semibold">Pagina Task</h3>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-default-500">
                Questa è una pagina placeholder per le task. Qui potrai gestire
                tutte le tue attività.
              </p>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
