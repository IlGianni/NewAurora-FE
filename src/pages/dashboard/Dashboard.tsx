import React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Progress,
} from "@heroui/react";
import {Icon} from "@iconify/react";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-default-500 mt-2">Benvenuto nel tuo Project Manager</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon icon="solar:widget-2-outline" className="text-primary text-2xl" />
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
              <Icon icon="solar:checklist-minimalistic-outline" className="text-success text-2xl" />
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
              <Icon icon="solar:users-group-two-rounded-outline" className="text-warning text-2xl" />
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
              <Icon icon="solar:calendar-outline" className="text-secondary text-2xl" />
            </div>
            <div>
              <p className="text-small text-default-500">Eventi Oggi</p>
              <p className="text-2xl font-bold">5</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Progetti Recenti</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">E-commerce Platform</p>
                <p className="text-small text-default-500">Scadenza: 15 Gennaio</p>
              </div>
              <Chip color="primary" size="sm">In Corso</Chip>
            </div>
            <Progress value={75} className="w-full" />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mobile App</p>
                <p className="text-small text-default-500">Scadenza: 20 Gennaio</p>
              </div>
              <Chip color="success" size="sm">Completato</Chip>
            </div>
            <Progress value={100} className="w-full" />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Website Redesign</p>
                <p className="text-small text-default-500">Scadenza: 25 Gennaio</p>
              </div>
              <Chip color="warning" size="sm">In Ritardo</Chip>
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
              <Icon icon="solar:clock-circle-outline" className="text-danger text-xl" />
              <div className="flex-1">
                <p className="font-medium">Fix Bug Login</p>
                <p className="text-small text-default-500">Priorità Alta</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Icon icon="solar:document-outline" className="text-warning text-xl" />
              <div className="flex-1">
                <p className="font-medium">Aggiorna Documentazione</p>
                <p className="text-small text-default-500">Priorità Media</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Icon icon="solar:settings-outline" className="text-primary text-xl" />
              <div className="flex-1">
                <p className="font-medium">Configurazione Server</p>
                <p className="text-small text-default-500">Priorità Alta</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Azioni Rapide</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-2 p-4 border border-divider rounded-lg hover:bg-default-50 cursor-pointer transition-colors">
              <Icon icon="solar:add-circle-outline" className="text-primary text-3xl" />
              <p className="text-small font-medium">Nuovo Progetto</p>
            </div>
            
            <div className="flex flex-col items-center gap-2 p-4 border border-divider rounded-lg hover:bg-default-50 cursor-pointer transition-colors">
              <Icon icon="solar:checklist-outline" className="text-success text-3xl" />
              <p className="text-small font-medium">Nuova Task</p>
            </div>
            
            <div className="flex flex-col items-center gap-2 p-4 border border-divider rounded-lg hover:bg-default-50 cursor-pointer transition-colors">
              <Icon icon="solar:user-plus-outline" className="text-warning text-3xl" />
              <p className="text-small font-medium">Aggiungi Team</p>
            </div>
            
            <div className="flex flex-col items-center gap-2 p-4 border border-divider rounded-lg hover:bg-default-50 cursor-pointer transition-colors">
              <Icon icon="solar:calendar-add-outline" className="text-secondary text-3xl" />
              <p className="text-small font-medium">Nuovo Evento</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}