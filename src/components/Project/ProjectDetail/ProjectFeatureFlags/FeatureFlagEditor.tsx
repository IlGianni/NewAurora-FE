import { useState } from "react";
import { Icon } from "@iconify/react";
import {
  Button,
  Tabs,
  Tab,
  Card,
  CardBody,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Switch,
} from "@heroui/react";

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  targets?: Array<{
    id: string;
    name?: string;
    type: string;
    operator: string;
    value: string;
    flagValue: boolean;
  }>;
}

interface FeatureFlagEditorProps {
  selectedFlag: {
    groupId: string | null; // null = senza gruppo
    flag: FeatureFlag;
  };
  onClose: () => void;
  onSave: (
    groupId: string | null,
    flagId: string,
    name: string,
    key: string,
    description: string,
    targetingRules: Array<{
      id: string;
      name?: string;
      type: string;
      operator: string;
      value: string;
      flagValue: boolean;
    }>,
    rules: Array<{
      id: string;
      field: string;
      operator: string;
      value: string;
    }>
  ) => void;
}

export default function FeatureFlagEditor({
  selectedFlag,
  onClose,
  onSave,
}: FeatureFlagEditorProps) {
  const [editFlagName, setEditFlagName] = useState(selectedFlag.flag.name);
  const [editFlagKey, setEditFlagKey] = useState(selectedFlag.flag.key);
  const [editFlagDescription, setEditFlagDescription] = useState(
    selectedFlag.flag.description
  );
  const localEnabled = selectedFlag.flag.enabled;
  const [defaultRule, setDefaultRule] = useState(true);

  // Targeting states - carica i target esistenti se presenti
  const [targetingRules, setTargetingRules] = useState<
    Array<{
      id: string;
      name?: string;
      type: string;
      operator: string;
      value: string;
      flagValue: boolean;
    }>
  >(selectedFlag.flag.targets || []);

  // Rules states
  const [rules, setRules] = useState<
    Array<{
      id: string;
      field: string;
      operator: string;
      value: string;
    }>
  >([]);

  const addTargetingRule = () => {
    const newTargetingRule = {
      id: Date.now().toString(),
      name: "",
      type: "user",
      operator: "equals",
      value: "",
      flagValue: true,
    };
    setTargetingRules([...targetingRules, newTargetingRule]);
  };

  const updateTargetingRule = (
    id: string,
    key: string,
    value: string | boolean
  ) => {
    setTargetingRules(
      targetingRules.map((rule) =>
        rule.id === id ? { ...rule, [key]: value } : rule
      )
    );
  };

  const removeTargetingRule = (id: string) => {
    setTargetingRules(targetingRules.filter((rule) => rule.id !== id));
  };

  const addRule = () => {
    const newRule = {
      id: Date.now().toString(),
      field: "",
      operator: "equals",
      value: "",
    };
    setRules([...rules, newRule]);
  };

  const updateRule = (id: string, key: string, value: string) => {
    setRules(
      rules.map((rule) => (rule.id === id ? { ...rule, [key]: value } : rule))
    );
  };

  const removeRule = (id: string) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  // Genera il nome leggibile del target
  const getTargetName = (target: {
    name?: string;
    type: string;
    operator: string;
    value: string;
  }) => {
    const typeNames: { [key: string]: string } = {
      user: "Utente",
      domain: "Dominio",
      country: "Paese",
      region: "Regione",
      city: "Città",
      ip: "IP",
      device: "Dispositivo",
      browser: "Browser",
      os: "OS",
      version: "Versione",
      plan: "Piano",
      role: "Ruolo",
      language: "Lingua",
      timezone: "Timezone",
      custom: "Custom",
    };

    const operatorNames: { [key: string]: string } = {
      equals: "=",
      not_equals: "≠",
      contains: "⊃",
      not_contains: "⊅",
      starts_with: "^",
      ends_with: "$",
      in: "∈",
      not_in: "∉",
      greater_than: ">",
      less_than: "<",
      regex: "~",
    };

    return `${typeNames[target.type] || target.type} ${
      operatorNames[target.operator] || target.operator
    } "${target.value}"`;
  };

  const handleSave = () => {
    if (!editFlagName.trim()) return;
    onSave(
      selectedFlag.groupId,
      selectedFlag.flag.id,
      editFlagName,
      editFlagKey,
      editFlagDescription,
      targetingRules,
      rules
    );
  };

  // Genera il JSON della configurazione
  const generateJSON = () => {
    return {
      id: selectedFlag.flag.id,
      key: editFlagName,
      description: editFlagDescription,
      enabled: localEnabled,
      targeting: targetingRules.map((rule) => ({
        type: rule.type,
        operator: rule.operator,
        value: rule.value,
        serve: rule.flagValue,
      })),
      rules: rules.map((rule) => ({
        field: rule.field,
        operator: rule.operator,
        value: rule.value,
      })),
      default: {
        serve: defaultRule,
      },
    };
  };

  return (
    <div className="h-full w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-default-200">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            variant="light"
            onPress={onClose}
            className="min-w-8 w-8 h-8"
          >
            <Icon icon="lucide:arrow-left" width={18} />
          </Button>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: localEnabled ? "green" : "red",
              }}
            />
            <h1 className="text-xl font-semibold text-default-900">
              {editFlagName || selectedFlag.flag.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            color="default"
            variant="light"
            onPress={onClose}
            className="min-w-20"
          >
            Annulla
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            isDisabled={!editFlagName.trim()}
            className="min-w-24"
          >
            Salva
          </Button>
        </div>
      </div>

      {/* Informazioni base */}
      <Card shadow="none" className="border border-default-200">
        <CardBody className="gap-4 p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nome"
              variant="bordered"
              type="text"
              value={editFlagName}
              onChange={(e) => setEditFlagName(e.target.value)}
              classNames={{
                input: "text-sm",
                label: "text-xs",
              }}
            />
            <Input
              label="Chiave"
              variant="bordered"
              type="text"
              value={editFlagKey}
              onChange={(e) => setEditFlagKey(e.target.value)}
              classNames={{
                input: "text-sm font-mono",
                label: "text-xs",
              }}
            />
          </div>
          <Textarea
            label="Descrizione"
            variant="bordered"
            value={editFlagDescription}
            onChange={(e) => setEditFlagDescription(e.target.value)}
            placeholder="Breve descrizione della feature flag..."
            minRows={2}
            classNames={{
              input: "text-sm",
              label: "text-xs",
            }}
          />
          <div
            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
              defaultRule
                ? "bg-success-50 border-success-200 hover:border-success-300"
                : "bg-default-50 border-default-200 hover:border-default-300"
            }`}
          >
            <div className="flex items-center gap-4 flex-1">
              <div
                className={`p-2 rounded-lg transition-all duration-200 ${
                  defaultRule ? "bg-success-100 shadow-sm" : "bg-default-100"
                }`}
              >
                <Icon
                  icon="lucide:shield-check"
                  width={16}
                  className={
                    defaultRule ? "text-success-600" : "text-default-500"
                  }
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p
                    className={`text-sm font-semibold transition-colors ${
                      defaultRule ? "text-success-900" : "text-default-900"
                    }`}
                  >
                    Valore Default
                  </p>
                  {defaultRule && (
                    <Chip
                      variant="flat"
                      color="success"
                      size="sm"
                      className="h-5 px-1.5 text-[10px] font-semibold"
                    >
                      ON
                    </Chip>
                  )}
                </div>
                <p className="text-xs text-default-500 leading-relaxed">
                  Valore ritornato se nessun target matcha
                </p>
              </div>
            </div>
            <div className="ml-4">
              <Switch
                color={defaultRule ? "success" : "default"}
                isSelected={defaultRule}
                onValueChange={setDefaultRule}
                classNames={{
                  wrapper: "group-data-[selected=true]:bg-success",
                }}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Tabs */}
      <Tabs
        aria-label="Opzioni Feature Flag"
        defaultSelectedKey="targeting"
        variant="underlined"
        color="primary"
        className="w-full"
      >
        <Tab
          key="targeting"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:target" width={14} />
              <span>Target</span>
              {targetingRules.length > 0 && (
                <Chip
                  color="primary"
                  variant="flat"
                  size="sm"
                  className="h-5 min-w-5 px-1.5"
                >
                  {targetingRules.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="py-6 space-y-5">
            {/* Lista compatta target con toggle */}
            {targetingRules.length > 0 && (
              <Card shadow="none" className="border border-default-200">
                <CardBody className="gap-3 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      icon="lucide:list"
                      width={14}
                      className="text-default-500"
                    />
                    <span className="text-xs font-semibold text-default-700 uppercase tracking-wide">
                      Target Attivi
                    </span>
                  </div>
                  <div className="space-y-2">
                    {targetingRules.map((target) => (
                      <div
                        key={target.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-default-200 bg-default-50 hover:bg-default-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-1 rounded bg-primary-50">
                            <Icon
                              icon="lucide:target"
                              width={12}
                              className="text-primary flex-shrink-0"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            {target.name ? (
                              <>
                                <div className="text-sm font-medium text-default-900 truncate">
                                  {target.name}
                                </div>
                                <div className="text-xs text-default-500 truncate">
                                  {getTargetName(target)}
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-default-700 truncate">
                                {getTargetName(target)}
                              </span>
                            )}
                          </div>
                        </div>
                        <Switch
                          color="success"
                          isSelected={target.flagValue}
                          isDisabled={!localEnabled}
                          onValueChange={(value) =>
                            updateTargetingRule(target.id, "flagValue", value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Dettagli configurazione target */}
            {targetingRules.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="lucide:settings"
                    width={14}
                    className="text-default-500"
                  />
                  <span className="text-xs font-semibold text-default-700 uppercase tracking-wide">
                    Configurazione Target
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {targetingRules.map((targetingRule, index) => (
                    <Card
                      key={targetingRule.id}
                      shadow="none"
                      className="border border-default-200"
                    >
                      <CardBody className="gap-4 p-5">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {index + 1}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-default-700">
                              Target {index + 1}
                            </span>
                          </div>
                          <Button
                            isIconOnly
                            variant="light"
                            color="danger"
                            size="sm"
                            onPress={() =>
                              removeTargetingRule(targetingRule.id)
                            }
                            className="min-w-8 w-8 h-8"
                          >
                            <Icon icon="lucide:trash-2" width={14} />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          <Input
                            label="Nome Target (opzionale)"
                            type="text"
                            value={targetingRule.name || ""}
                            onChange={(e) =>
                              updateTargetingRule(
                                targetingRule.id,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="es. Admin Users, Beta Testers..."
                            variant="bordered"
                            classNames={{
                              input: "text-sm",
                              label: "text-xs",
                            }}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Select
                              label="Tipo"
                              selectedKeys={[targetingRule.type]}
                              onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string;
                                updateTargetingRule(
                                  targetingRule.id,
                                  "type",
                                  value
                                );
                              }}
                              variant="bordered"
                              classNames={{
                                trigger: "h-12",
                                label: "text-xs",
                              }}
                            >
                              <SelectItem key="user">Utente (email)</SelectItem>
                              <SelectItem key="domain">Dominio</SelectItem>
                              <SelectItem key="country">Paese</SelectItem>
                              <SelectItem key="region">Regione</SelectItem>
                              <SelectItem key="city">Città</SelectItem>
                              <SelectItem key="ip">Indirizzo IP</SelectItem>
                              <SelectItem key="device">Dispositivo</SelectItem>
                              <SelectItem key="browser">Browser</SelectItem>
                              <SelectItem key="os">
                                Sistema Operativo
                              </SelectItem>
                              <SelectItem key="version">
                                Versione App
                              </SelectItem>
                              <SelectItem key="plan">Piano</SelectItem>
                              <SelectItem key="role">Ruolo</SelectItem>
                              <SelectItem key="language">Lingua</SelectItem>
                              <SelectItem key="timezone">Timezone</SelectItem>
                              <SelectItem key="custom">
                                Personalizzato
                              </SelectItem>
                            </Select>

                            <Select
                              label="Operatore"
                              selectedKeys={[targetingRule.operator]}
                              onSelectionChange={(keys) => {
                                const value = Array.from(keys)[0] as string;
                                updateTargetingRule(
                                  targetingRule.id,
                                  "operator",
                                  value
                                );
                              }}
                              variant="bordered"
                              classNames={{
                                trigger: "h-12",
                                label: "text-xs",
                              }}
                            >
                              <SelectItem key="equals">Uguale a</SelectItem>
                              <SelectItem key="not_equals">
                                Diverso da
                              </SelectItem>
                              <SelectItem key="contains">Contiene</SelectItem>
                              <SelectItem key="not_contains">
                                Non contiene
                              </SelectItem>
                              <SelectItem key="starts_with">
                                Inizia con
                              </SelectItem>
                              <SelectItem key="ends_with">
                                Termina con
                              </SelectItem>
                              <SelectItem key="in">In lista</SelectItem>
                              <SelectItem key="not_in">Non in lista</SelectItem>
                              <SelectItem key="greater_than">
                                Maggiore di
                              </SelectItem>
                              <SelectItem key="less_than">Minore di</SelectItem>
                              <SelectItem key="regex">Regex</SelectItem>
                            </Select>

                            <Input
                              label="Valore"
                              type="text"
                              value={targetingRule.value}
                              onChange={(e) =>
                                updateTargetingRule(
                                  targetingRule.id,
                                  "value",
                                  e.target.value
                                )
                              }
                              placeholder={
                                targetingRule.type === "user"
                                  ? "user@example.com"
                                  : targetingRule.type === "domain"
                                  ? "example.com"
                                  : targetingRule.type === "country"
                                  ? "IT"
                                  : "valore..."
                              }
                              variant="bordered"
                              classNames={{
                                input: "text-sm",
                                label: "text-xs",
                              }}
                            />
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <Button
              onPress={addTargetingRule}
              variant="bordered"
              className="w-full border-dashed border-default-300 hover:border-primary transition-colors"
              startContent={<Icon icon="lucide:plus" width={16} />}
            >
              Aggiungi Target
            </Button>

            {targetingRules.length === 0 && (
              <div className="text-center py-8 text-sm text-default-500">
                <Icon
                  icon="lucide:target"
                  width={32}
                  className="mx-auto mb-2 text-default-300"
                />
                <p>Nessun target configurato</p>
                <p className="text-xs mt-1">Aggiungi un target per iniziare</p>
              </div>
            )}
          </div>
        </Tab>

        <Tab
          key="rules"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:filter" width={14} />
              <span>Regole</span>
              {rules.length > 0 && (
                <Chip
                  color="secondary"
                  variant="flat"
                  size="sm"
                  className="h-5 min-w-5 px-1.5"
                >
                  {rules.length}
                </Chip>
              )}
            </div>
          }
        >
          <div className="py-6 space-y-5">
            {rules.length > 0 ? (
              <div className="flex flex-col gap-4">
                {rules.map((rule, index) => (
                  <Card
                    key={rule.id}
                    shadow="none"
                    className="border border-default-200"
                  >
                    <CardBody className="gap-4 p-5">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary-50 flex items-center justify-center">
                            <span className="text-xs font-semibold text-secondary">
                              {index + 1}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-default-700">
                            Regola {index + 1}
                          </span>
                          {index < rules.length - 1 && (
                            <Chip
                              variant="flat"
                              color="secondary"
                              size="sm"
                              className="ml-2"
                            >
                              AND
                            </Chip>
                          )}
                        </div>
                        <Button
                          isIconOnly
                          variant="light"
                          color="danger"
                          size="sm"
                          onPress={() => removeRule(rule.id)}
                          className="min-w-8 w-8 h-8"
                        >
                          <Icon icon="lucide:trash-2" width={14} />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                          label="Campo"
                          type="text"
                          value={rule.field}
                          onChange={(e) =>
                            updateRule(rule.id, "field", e.target.value)
                          }
                          placeholder="es. country"
                          variant="bordered"
                          classNames={{
                            input: "text-sm",
                            label: "text-xs",
                          }}
                        />

                        <Select
                          label="Operatore"
                          selectedKeys={[rule.operator]}
                          onSelectionChange={(keys) => {
                            const value = Array.from(keys)[0] as string;
                            updateRule(rule.id, "operator", value);
                          }}
                          variant="bordered"
                          classNames={{
                            trigger: "h-12",
                            label: "text-xs",
                          }}
                        >
                          <SelectItem key="equals">Uguale a</SelectItem>
                          <SelectItem key="not_equals">Diverso da</SelectItem>
                          <SelectItem key="contains">Contiene</SelectItem>
                          <SelectItem key="not_contains">
                            Non contiene
                          </SelectItem>
                          <SelectItem key="greater_than">
                            Maggiore di
                          </SelectItem>
                          <SelectItem key="less_than">Minore di</SelectItem>
                        </Select>

                        <Input
                          label="Valore"
                          type="text"
                          value={rule.value}
                          onChange={(e) =>
                            updateRule(rule.id, "value", e.target.value)
                          }
                          placeholder="es. IT"
                          variant="bordered"
                          classNames={{
                            input: "text-sm",
                            label: "text-xs",
                          }}
                        />
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : null}

            <Button
              onPress={addRule}
              variant="bordered"
              className="w-full border-dashed border-default-300 hover:border-secondary transition-colors"
              startContent={<Icon icon="lucide:plus" width={16} />}
            >
              Aggiungi Regola
            </Button>

            {rules.length === 0 && (
              <div className="text-center py-8 text-sm text-default-500">
                <Icon
                  icon="lucide:filter"
                  width={32}
                  className="mx-auto mb-2 text-default-300"
                />
                <p>Nessuna regola configurata</p>
                <p className="text-xs mt-1">
                  Aggiungi una regola per filtrare i target
                </p>
              </div>
            )}
          </div>
        </Tab>

        <Tab
          key="flow"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:workflow" width={14} />
              <span>Flusso</span>
            </div>
          }
        >
          <div className="py-6">
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* User Request - compatto */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-primary-50 border border-primary-200">
                  <Icon
                    icon="lucide:user"
                    width={16}
                    className="text-primary"
                  />
                  <span className="text-xs font-medium text-default-900">
                    User Request
                  </span>
                </div>
              </div>

              {/* Freccia */}
              <div className="flex justify-center">
                <Icon
                  icon="lucide:arrow-down"
                  width={20}
                  className="text-primary-400 animate-bounce"
                />
              </div>

              {/* Controllo Feature Flag Enabled - minimal */}
              <div className="flex justify-center">
                <div
                  className={`flex items-center justify-between gap-4 px-4 py-2 rounded-md border ${
                    localEnabled
                      ? "border-success-300 bg-success-50"
                      : "border-danger-300 bg-danger-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      icon={
                        localEnabled ? "lucide:check-circle" : "lucide:x-circle"
                      }
                      width={16}
                      className={localEnabled ? "text-success" : "text-danger"}
                    />
                    <span className="text-xs font-medium text-default-900">
                      Feature Flag
                    </span>
                  </div>
                  <Chip
                    color={localEnabled ? "success" : "danger"}
                    variant="flat"
                  >
                    {localEnabled ? "ON" : "OFF"}
                  </Chip>
                </div>
              </div>

              {localEnabled && (
                <>
                  {/* Freccia */}
                  <div className="flex justify-center">
                    <Icon
                      icon="lucide:arrow-down"
                      width={20}
                      className="text-success-400 animate-bounce"
                    />
                  </div>

                  {/* Rules Evaluation - minimal rettangolari (PRIMA) */}
                  {rules.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-center">
                        <span className="text-xs text-default-500">
                          Regole (AND)
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center">
                        {rules.map((rule) => (
                          <div
                            key={rule.id}
                            className="flex items-center gap-2 px-3 py-1.5 rounded border border-secondary-200 bg-secondary-50 text-xs"
                          >
                            <Icon
                              icon="lucide:filter"
                              width={12}
                              className="text-secondary"
                            />
                            <span className="text-secondary-700 font-medium">
                              {rule.field}
                            </span>
                            <span className="text-default-500">
                              {rule.operator}
                            </span>
                            <span className="text-default-700 font-mono">
                              "{rule.value}"
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {rules.length > 0 && (
                    <div className="flex justify-center">
                      <Icon
                        icon="lucide:arrow-down"
                        width={20}
                        className="text-secondary-400 animate-bounce"
                      />
                    </div>
                  )}

                  {/* Target Evaluation - minimal rettangolari (DOPO) */}
                  {targetingRules.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-center">
                        <span className="text-xs text-default-500">
                          Target (OR)
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center">
                        {targetingRules.map((target) => (
                          <div
                            key={target.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs ${
                              target.flagValue
                                ? "border-success-300 bg-success-50 text-success-700"
                                : "border-default-200 bg-default-50 text-default-500"
                            }`}
                          >
                            <Icon
                              icon="lucide:target"
                              width={12}
                              className={
                                target.flagValue
                                  ? "text-success"
                                  : "text-default-400"
                              }
                            />
                            <span className="font-medium truncate max-w-[200px]">
                              {target.name || getTargetName(target)}
                            </span>
                            <span className="text-[10px] font-mono">
                              {target.flagValue ? "ON" : "OFF"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {targetingRules.length > 0 && (
                    <div className="flex justify-center">
                      <Icon
                        icon="lucide:arrow-down"
                        width={20}
                        className="text-success-400 animate-bounce"
                      />
                    </div>
                  )}

                  {/* Default Rule - minimal */}
                  <div className="flex justify-center">
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs ${
                        defaultRule
                          ? "border-success-300 bg-success-50"
                          : "border-danger-300 bg-danger-50"
                      }`}
                    >
                      <Icon
                        icon="lucide:shield-check"
                        width={12}
                        className={defaultRule ? "text-success" : "text-danger"}
                      />
                      <span className="text-default-700 font-medium">
                        Default
                      </span>
                      <span
                        className={`font-mono ${
                          defaultRule ? "text-success-700" : "text-danger-700"
                        }`}
                      >
                        {defaultRule ? "true" : "false"}
                      </span>
                    </div>
                  </div>

                  {/* Freccia finale */}
                  <div className="flex justify-center">
                    <Icon
                      icon="lucide:arrow-down"
                      width={20}
                      className="text-default-400 animate-bounce"
                    />
                  </div>
                </>
              )}

              {/* Risultato Finale - minimal */}
              <div className="flex justify-center">
                <div
                  className={`flex items-center gap-3 px-4 py-2 rounded-md border ${
                    localEnabled
                      ? "border-success-400 bg-success-100"
                      : "border-danger-400 bg-danger-100"
                  }`}
                >
                  <Icon
                    icon={
                      localEnabled ? "lucide:check-circle-2" : "lucide:x-circle"
                    }
                    width={20}
                    className={localEnabled ? "text-success" : "text-danger"}
                  />
                  <div>
                    <div className="text-sm font-bold text-default-900">
                      {localEnabled ? "ATTIVA" : "DISATTIVA"}
                    </div>
                    <div className="text-xs text-default-600">
                      {localEnabled
                        ? "Feature disponibile"
                        : "Feature bloccata"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tab>

        <Tab
          key="analytics"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:bar-chart-3" width={14} />
              <span>Analitiche</span>
            </div>
          }
        >
          <div className="py-6 space-y-6">
            {/* Header con Configurazione */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-default-900">
                  Dashboard Analitiche
                </h2>
                <p className="text-xs text-default-500 mt-0.5">
                  Monitoraggio in tempo reale dell'utilizzo della feature flag
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-default-200 bg-white">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      localEnabled ? "bg-success" : "bg-danger"
                    } animate-pulse`}
                  />
                  <span className="text-xs font-medium text-default-700">
                    {localEnabled ? "Attiva" : "Disattiva"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-default-500">
                  <Icon icon="lucide:layers" width={14} />
                  <span>{targetingRules.length} target</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-default-500">
                  <Icon icon="lucide:filter" width={14} />
                  <span>{rules.length} regole</span>
                </div>
              </div>
            </div>

            {/* KPI Cards - Minimal */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-primary-200 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <Icon
                      icon="lucide:eye"
                      width={18}
                      className="text-primary"
                    />
                  </div>
                  <Chip variant="flat" color="primary">
                    +23%
                  </Chip>
                </div>
                <p className="text-2xl font-bold text-default-900">
                  {localEnabled ? "12,458" : "0"}
                </p>
                <p className="text-xs text-default-500 mt-1">
                  Visualizzazioni totali
                </p>
              </div>

              <div className="p-4 rounded-xl border border-primary-200 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary-50">
                    <Icon
                      icon="lucide:users"
                      width={18}
                      className="text-primary"
                    />
                  </div>
                  <Chip variant="flat" color="primary">
                    +15%
                  </Chip>
                </div>
                <p className="text-2xl font-bold text-default-900">
                  {localEnabled ? "3,247" : "0"}
                </p>
                <p className="text-xs text-default-500 mt-1">Utenti unici</p>
              </div>
            </div>

            {/* Grafico Visualizzazioni nel Tempo */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-default-900">
                  Visualizzazioni Ultimi 7 Giorni
                </h3>
                <div className="flex gap-2">
                  <Button variant="flat" color="primary">
                    7g
                  </Button>
                  <Button variant="flat" color="default">
                    30g
                  </Button>
                </div>
              </div>

              {localEnabled ? (
                <div className="p-6 rounded-xl border border-default-200 bg-white">
                  <div className="flex items-end justify-between gap-3 h-48">
                    {[
                      { day: "Lun", value: 1850, maxValue: 3000 },
                      { day: "Mar", value: 2210, maxValue: 3000 },
                      { day: "Mer", value: 1560, maxValue: 3000 },
                      { day: "Gio", value: 2610, maxValue: 3000 },
                      { day: "Ven", value: 2500, maxValue: 3000 },
                      { day: "Sab", value: 1280, maxValue: 3000 },
                      { day: "Dom", value: 1080, maxValue: 3000 },
                    ].map((item, index) => {
                      const heightPercentage =
                        (item.value / item.maxValue) * 100;
                      const isToday = index === 6; // Domenica come esempio

                      return (
                        <div
                          key={index}
                          className="flex-1 flex flex-col items-center gap-2 group"
                        >
                          {/* Valore sopra la barra */}
                          <div
                            className={`text-xs font-semibold transition-all ${
                              isToday ? "text-default-900" : "text-default-700"
                            } opacity-0 group-hover:opacity-100`}
                          >
                            {item.value.toLocaleString()}
                          </div>

                          {/* Barra verticale */}
                          <div
                            className="w-full flex items-end"
                            style={{ height: "160px" }}
                          >
                            <div
                              className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer relative ${
                                isToday
                                  ? "bg-sky-500 hover:bg-sky-600 shadow-lg"
                                  : "bg-sky-400 hover:bg-sky-500"
                              }`}
                              style={{ height: `${heightPercentage}%` }}
                            >
                              {/* Tooltip al hover */}
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-default-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                {item.value.toLocaleString()} views
                              </div>
                            </div>
                          </div>

                          {/* Etichetta giorno */}
                          <div
                            className={`text-xs font-medium ${
                              isToday
                                ? "text-default-900 font-bold"
                                : "text-default-500"
                            }`}
                          >
                            {item.day}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Linea base */}
                  <div className="w-full h-px bg-default-300 mt-2" />

                  {/* Statistiche sotto il grafico */}
                  <div className="flex items-center justify-between mt-4 text-xs">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-default-500">
                          Media giornaliera:
                        </span>
                        <span className="font-semibold text-default-900 ml-1">
                          1,870
                        </span>
                      </div>
                      <div>
                        <span className="text-default-500">Picco:</span>
                        <span className="font-semibold text-success ml-1">
                          2,610
                        </span>
                      </div>
                    </div>
                    <div className="text-default-500">
                      Totale:{" "}
                      <span className="font-semibold text-default-900">
                        13,090
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-lg border border-dashed border-default-200 bg-default-50 text-center">
                  <Icon
                    icon="lucide:bar-chart-3"
                    width={48}
                    className="text-default-300 mx-auto mb-3"
                  />
                  <p className="text-sm font-medium text-default-700 mb-1">
                    Nessun dato disponibile
                  </p>
                  <p className="text-xs text-default-500">
                    Attiva la feature flag per vedere le visualizzazioni
                  </p>
                </div>
              )}
            </div>

            {/* Distribuzione per Target */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-default-900">
                  Distribuzione per Target
                </h3>
                {targetingRules.length === 0 && (
                  <Chip variant="flat" color="default">
                    Nessun target
                  </Chip>
                )}
              </div>

              {targetingRules.length > 0 ? (
                <div className="p-4 rounded-xl border border-default-200 bg-white space-y-3">
                  {targetingRules.map((target, index) => {
                    // Simula dati basati sull'ordine e stato del target
                    const baseValue = localEnabled ? 100 - index * 15 : 0;
                    const actualValue = target.flagValue
                      ? Math.max(baseValue, 5)
                      : 0;
                    const estimatedUsers = Math.floor(
                      (actualValue / 100) * 3247
                    );

                    return (
                      <div key={target.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="lucide:target"
                              width={12}
                              className={
                                target.flagValue
                                  ? "text-primary"
                                  : "text-default-400"
                              }
                            />
                            <span className="text-default-700 font-medium">
                              {target.name || getTargetName(target)}
                            </span>
                            {!target.flagValue && (
                              <Chip variant="flat" color="default">
                                OFF
                              </Chip>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-default-500">
                              ~{estimatedUsers.toLocaleString()} utenti
                            </span>
                            <span className="text-default-900 font-medium">
                              {actualValue}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-default-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              target.flagValue ? "bg-primary" : "bg-default-300"
                            } rounded-full transition-all`}
                            style={{ width: `${actualValue}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Default Rule */}
                  {localEnabled && (
                    <div className="space-y-1 pt-3 mt-3 border-t border-default-200">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Icon
                            icon="lucide:shield-check"
                            width={12}
                            className="text-primary"
                          />
                          <span className="text-default-700 font-medium">
                            Default Rule (no match)
                          </span>
                          <Chip
                            variant="flat"
                            color={defaultRule ? "primary" : "default"}
                          >
                            {defaultRule ? "true" : "false"}
                          </Chip>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-default-500">
                            ~{Math.floor(3247 * 0.1).toLocaleString()} utenti
                          </span>
                          <span className="text-default-900 font-medium">
                            10%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-default-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            defaultRule ? "bg-primary" : "bg-default-300"
                          } rounded-full transition-all`}
                          style={{ width: "10%" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center rounded-lg border border-dashed border-default-200">
                  <Icon
                    icon="lucide:target"
                    width={32}
                    className="text-default-300 mx-auto mb-2"
                  />
                  <p className="text-sm text-default-500">
                    Configura dei target per vedere la distribuzione
                  </p>
                </div>
              )}
            </div>

            {/* Regole AND Configurate */}
            {rules.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-default-900">
                  Regole AND Configurate
                </h3>

                <div className="p-4 rounded-xl border border-primary-200 bg-white space-y-2">
                  {rules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg hover:bg-default-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-primary-50 text-primary px-2 py-1 rounded font-mono font-semibold">
                          {index + 1}
                        </span>
                        <Icon
                          icon="lucide:filter"
                          width={12}
                          className="text-primary"
                        />
                        <span className="text-default-700">
                          <span className="font-medium">{rule.field}</span>{" "}
                          <span className="text-default-500">
                            {rule.operator}
                          </span>{" "}
                          <span className="font-mono bg-default-100 px-1 rounded">
                            "{rule.value}"
                          </span>
                        </span>
                      </div>
                      <Chip variant="flat" color="primary">
                        AND
                      </Chip>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-default-200">
                    <p className="text-xs text-default-500 flex items-center gap-1">
                      <Icon
                        icon="lucide:info"
                        width={12}
                        className="text-primary"
                      />
                      Tutte le regole devono essere soddisfatte
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Metriche Aggiuntive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Distribuzione per tipo di Target */}
              <div className="p-4 rounded-xl border border-primary-200 bg-white space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary-50">
                    <Icon
                      icon="lucide:layers"
                      width={14}
                      className="text-primary"
                    />
                  </div>
                  <h4 className="text-sm font-semibold text-default-900">
                    Per Tipo di Target
                  </h4>
                </div>
                {targetingRules.length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      // Raggruppa per tipo
                      const typeGroups = targetingRules.reduce((acc, t) => {
                        const type = t.type;
                        if (!acc[type]) acc[type] = [];
                        acc[type].push(t);
                        return acc;
                      }, {} as Record<string, typeof targetingRules>);

                      return Object.entries(typeGroups).map(
                        ([type, targets]) => {
                          const activeCount = targets.filter(
                            (t) => t.flagValue
                          ).length;
                          const percentage = Math.round(
                            (targets.length / targetingRules.length) * 100
                          );

                          return (
                            <div
                              key={type}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono bg-default-100 px-2 py-0.5 rounded capitalize">
                                  {type}
                                </span>
                                <span className="text-xs text-default-500">
                                  {activeCount}/{targets.length} attivi
                                </span>
                              </div>
                              <span className="text-xs font-medium text-default-900">
                                {percentage}%
                              </span>
                            </div>
                          );
                        }
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-default-500 text-center py-4">
                    Nessun target configurato
                  </p>
                )}
              </div>

              {/* Statistiche Operatori */}
              <div className="p-4 rounded-xl border border-primary-200 bg-white space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary-50">
                    <Icon
                      icon="lucide:git-compare"
                      width={14}
                      className="text-primary"
                    />
                  </div>
                  <h4 className="text-sm font-semibold text-default-900">
                    Operatori Utilizzati
                  </h4>
                </div>
                {targetingRules.length > 0 ? (
                  <div className="space-y-2">
                    {(() => {
                      // Conta gli operatori
                      const operatorCounts = targetingRules.reduce((acc, t) => {
                        acc[t.operator] = (acc[t.operator] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>);

                      return Object.entries(operatorCounts).map(
                        ([operator, count]) => {
                          const percentage = Math.round(
                            (count / targetingRules.length) * 100
                          );

                          return (
                            <div
                              key={operator}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <Icon
                                  icon="lucide:git-compare"
                                  width={14}
                                  className="text-default-500"
                                />
                                <span className="text-xs text-default-700">
                                  {operator}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-default-500">
                                  {count} {count === 1 ? "volta" : "volte"}
                                </span>
                                <span className="text-xs font-medium text-default-900">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          );
                        }
                      );
                    })()}
                  </div>
                ) : (
                  <p className="text-xs text-default-500 text-center py-4">
                    Nessun operatore configurato
                  </p>
                )}
              </div>
            </div>
          </div>
        </Tab>

        <Tab
          key="json"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:code" width={14} />
              <span>JSON</span>
            </div>
          }
        >
          <div className="py-6 space-y-4">
            <Card
              shadow="none"
              className="bg-default-900 border border-default-200"
            >
              <CardBody className="relative p-0">
                <div className="absolute top-3 right-3 z-10">
                  <Button
                    variant="flat"
                    size="sm"
                    startContent={<Icon icon="lucide:copy" width={14} />}
                    onPress={() => {
                      navigator.clipboard.writeText(
                        JSON.stringify(generateJSON(), null, 2)
                      );
                    }}
                    className="bg-default-800 hover:bg-default-700 text-default-50"
                  >
                    Copia
                  </Button>
                </div>
                <pre className="text-default-50 p-5 overflow-x-auto text-xs font-mono leading-relaxed">
                  {JSON.stringify(generateJSON(), null, 2)}
                </pre>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
