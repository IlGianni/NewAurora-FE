import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
  Skeleton,
} from "@heroui/react";
import { Icon } from "@iconify/react";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  // Simula il caricamento dei dati
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      {isLoading ? (
        <div>
          <Skeleton className="h-9 w-48 rounded mb-2" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-default-500 mt-2">
            Benvenuto nel tuo Project Manager
          </p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          // Mostra skeleton durante il caricamento
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardBody className="flex flex-row items-center gap-4">
                <Skeleton className="flex rounded-lg w-12 h-12" />
                <div>
                  <Skeleton className="h-4 w-20 rounded mb-2" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardBody>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Icon
                    icon="solar:widget-2-outline"
                    className="text-primary text-2xl"
                  />
                </div>
                <div>
                  <p className="text-small text-default-500">Progetti Attivi</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <Icon
                    icon="solar:checklist-minimalistic-outline"
                    className="text-success text-2xl"
                  />
                </div>
                <div>
                  <p className="text-small text-default-500">Task Completate</p>
                  <p className="text-2xl font-bold">48</p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="p-3 bg-warning/10 rounded-lg">
                  <Icon
                    icon="solar:users-group-two-rounded-outline"
                    className="text-warning text-2xl"
                  />
                </div>
                <div>
                  <p className="text-small text-default-500">Team Members</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody className="flex flex-row items-center gap-4">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Icon
                    icon="solar:calendar-outline"
                    className="text-secondary text-2xl"
                  />
                </div>
                <div>
                  <p className="text-small text-default-500">Eventi Oggi</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>

      {/* Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          // Mostra skeleton durante il caricamento
          Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-6 w-32 rounded" />
              </CardHeader>
              <CardBody className="space-y-4">
                {Array.from({ length: 3 }).map((_, itemIndex) => (
                  <div key={itemIndex} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24 rounded" />
                      <Skeleton className="flex rounded-full w-16 h-6" />
                    </div>
                    <Skeleton className="h-2 w-full rounded" />
                  </div>
                ))}
              </CardBody>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Progetti Recenti</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">E-commerce Platform</p>
                    <p className="text-small text-default-500">
                      Scadenza: 15 Gennaio
                    </p>
                  </div>
                  <Chip color="primary" size="sm">
                    In Corso
                  </Chip>
                </div>
                <Progress value={75} className="w-full" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Mobile App</p>
                    <p className="text-small text-default-500">
                      Scadenza: 20 Gennaio
                    </p>
                  </div>
                  <Chip color="success" size="sm">
                    Completato
                  </Chip>
                </div>
                <Progress value={100} className="w-full" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Website Redesign</p>
                    <p className="text-small text-default-500">
                      Scadenza: 25 Gennaio
                    </p>
                  </div>
                  <Chip color="warning" size="sm">
                    In Ritardo
                  </Chip>
                </div>
                <Progress value={45} className="w-full" />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Task Urgenti</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-3">
                  <Icon
                    icon="solar:clock-circle-outline"
                    className="text-danger text-xl"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Fix Bug Login</p>
                    <p className="text-small text-default-500">Priorità Alta</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Icon
                    icon="solar:document-outline"
                    className="text-warning text-xl"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Aggiorna Documentazione</p>
                    <p className="text-small text-default-500">
                      Priorità Media
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Icon
                    icon="solar:settings-outline"
                    className="text-primary text-xl"
                  />
                  <div className="flex-1">
                    <p className="font-medium">Configurazione Server</p>
                    <p className="text-small text-default-500">Priorità Alta</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32 rounded" />
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 p-4 border border-divider rounded-lg"
                >
                  <Skeleton className="flex rounded w-12 h-12" />
                  <Skeleton className="h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Azioni Rapide</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col items-center gap-2 p-4 border border-divider rounded-lg hover:bg-default-50 cursor-pointer transition-colors">
                <Icon
                  icon="solar:add-circle-outline"
                  className="text-primary text-3xl"
                />
                <p className="text-small font-medium">Nuovo Progetto</p>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 border border-divider rounded-lg hover:bg-default-50 cursor-pointer transition-colors">
                <Icon
                  icon="solar:checklist-outline"
                  className="text-success text-3xl"
                />
                <p className="text-small font-medium">Nuova Task</p>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 border border-divider rounded-lg hover:bg-default-50 cursor-pointer transition-colors">
                <Icon
                  icon="solar:user-plus-outline"
                  className="text-warning text-3xl"
                />
                <p className="text-small font-medium">Aggiungi Team</p>
              </div>

              <div className="flex flex-col items-center gap-2 p-4 border border-divider rounded-lg hover:bg-default-50 cursor-pointer transition-colors">
                <Icon
                  icon="solar:calendar-add-outline"
                  className="text-secondary text-3xl"
                />
                <p className="text-small font-medium">Nuovo Evento</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
