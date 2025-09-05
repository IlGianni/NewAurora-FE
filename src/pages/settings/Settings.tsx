import React from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Switch,
  Divider,
  Button,
  Input,
  Textarea,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../contexts";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Impostazioni</h1>
        <p className="text-default-500 mt-2">Gestisci le tue preferenze e configurazioni</p>
      </div>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon icon="solar:palette-outline" className="text-primary text-2xl" />
            <h3 className="text-lg font-semibold">Aspetto</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Tema</p>
              <p className="text-small text-default-500">
                Scegli tra tema chiaro e scuro
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Icon 
                icon={theme === 'light' ? 'solar:sun-outline' : 'solar:moon-outline'} 
                className="text-default-500 text-xl" 
              />
              <Switch
                isSelected={theme === 'dark'}
                onValueChange={toggleTheme}
                color="primary"
                size="lg"
              />
              <span className="text-small text-default-500 min-w-[60px]">
                {theme === 'dark' ? 'Scuro' : 'Chiaro'}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon icon="solar:user-outline" className="text-primary text-2xl" />
            <h3 className="text-lg font-semibold">Profilo</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome"
              placeholder="Il tuo nome"
              defaultValue="Mario"
              variant="bordered"
            />
            <Input
              label="Cognome"
              placeholder="Il tuo cognome"
              defaultValue="Rossi"
              variant="bordered"
            />
          </div>
          <Input
            label="Email"
            placeholder="la-tua-email@example.com"
            defaultValue="mario.rossi@example.com"
            variant="bordered"
            type="email"
          />
          <Input
            label="Azienda"
            placeholder="Nome della tua azienda"
            defaultValue="SpaceDesign"
            variant="bordered"
          />
          <Button color="primary" className="w-fit">
            Salva Modifiche
          </Button>
        </CardBody>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon icon="solar:bell-outline" className="text-primary text-2xl" />
            <h3 className="text-lg font-semibold">Notifiche</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifiche Email</p>
              <p className="text-small text-default-500">
                Ricevi notifiche via email per nuovi progetti e task
              </p>
            </div>
            <Switch defaultSelected color="primary" />
          </div>
          
          <Divider />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifiche Push</p>
              <p className="text-small text-default-500">
                Ricevi notifiche push per eventi importanti
              </p>
            </div>
            <Switch defaultSelected color="primary" />
          </div>
          
          <Divider />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Promemoria Scadenze</p>
              <p className="text-small text-default-500">
                Ricevi promemoria per le scadenze dei progetti
              </p>
            </div>
            <Switch defaultSelected color="primary" />
          </div>
        </CardBody>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon icon="solar:shield-outline" className="text-primary text-2xl" />
            <h3 className="text-lg font-semibold">Sicurezza</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="space-y-3">
            <Input
              label="Password Attuale"
              placeholder="Inserisci la password attuale"
              type="password"
              variant="bordered"
            />
            <Input
              label="Nuova Password"
              placeholder="Inserisci la nuova password"
              type="password"
              variant="bordered"
            />
            <Input
              label="Conferma Password"
              placeholder="Conferma la nuova password"
              type="password"
              variant="bordered"
            />
          </div>
          <Button color="primary" className="w-fit">
            Cambia Password
          </Button>
        </CardBody>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon icon="solar:settings-outline" className="text-primary text-2xl" />
            <h3 className="text-lg font-semibold">Preferenze</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="space-y-3">
            <Input
              label="Lingua"
              placeholder="Seleziona la lingua"
              defaultValue="Italiano"
              variant="bordered"
            />
            <Input
              label="Fuso Orario"
              placeholder="Seleziona il fuso orario"
              defaultValue="Europe/Rome"
              variant="bordered"
            />
            <Textarea
              label="Note Personali"
              placeholder="Aggiungi note personali..."
              variant="bordered"
              minRows={3}
            />
          </div>
          <Button color="primary" className="w-fit">
            Salva Preferenze
          </Button>
        </CardBody>
      </Card>

      {/* Danger Zone */}
      <Card className="border-danger">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Icon icon="solar:danger-triangle-outline" className="text-danger text-2xl" />
            <h3 className="text-lg font-semibold text-danger">Zona Pericolosa</h3>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Elimina Account</p>
              <p className="text-small text-default-500">
                Elimina permanentemente il tuo account e tutti i dati associati
              </p>
            </div>
            <Button color="danger" variant="flat">
              Elimina Account
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}