import { useState } from "react";
import { Icon } from "@iconify/react";
import {
  Accordion,
  AccordionItem,
  Button,
  Switch,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
} from "@heroui/react";
import { Card, CardBody, Chip } from "@heroui/react";
import FeatureFlagEditor from "./FeatureFlagEditor";

interface FeatureFlagGroup {
  id: string;
  name: string;
  description: string;
  flags: FeatureFlag[];
}

interface TargetingRule {
  id: string;
  name?: string;
  type: string;
  operator: string;
  value: string;
  flagValue: boolean;
}

interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  targets?: TargetingRule[];
}

export default function ProjectFeatureFlags() {
  const [featureFlagsGroups, setFeatureFlagsGroups] = useState<
    FeatureFlagGroup[]
  >([
    {
      id: "1",
      name: "Funzionalità UI",
      description: "Feature flag per l'interfaccia utente",
      flags: [
        {
          id: "1-1",
          name: "Tema scuro",
          key: "dark_mode",
          description: "Abilita il tema scuro",
          enabled: true,
          targets: [
            {
              id: "t1",
              name: "Admin Users",
              type: "user",
              operator: "equals",
              value: "admin@test.com",
              flagValue: true,
            },
            {
              id: "t2",
              name: "Utenti Italiani",
              type: "country",
              operator: "equals",
              value: "IT",
              flagValue: false,
            },
          ],
        },
        {
          id: "1-2",
          name: "Nuova dashboard",
          key: "new_dashboard",
          description: "Nuova dashboard con grafici avanzati",
          enabled: false,
          targets: [],
        },
      ],
    },
    {
      id: "2",
      name: "Backend API",
      description: "Feature flag per le funzionalità backend",
      flags: [
        {
          id: "2-1",
          name: "API v2",
          key: "api_v2",
          description: "Abilita la versione 2 delle API",
          enabled: false,
          targets: [],
        },
      ],
    },
  ]);
  const [ungroupedFlags, setUngroupedFlags] = useState<FeatureFlag[]>([
    {
      id: "ungrouped-1",
      name: "Feature Standalone",
      key: "standalone_feature",
      description: "Feature flag senza gruppo",
      enabled: true,
      targets: [],
    },
  ]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isEditingFlag, setIsEditingFlag] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<{
    groupId: string | null; // null = senza gruppo
    flag: FeatureFlag;
  } | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedFlags, setSelectedFlags] = useState<
    {
      flagId: string;
      groupId: string | null;
    }[]
  >([]);
  const [bulkActionTargetGroup, setBulkActionTargetGroup] =
    useState<string>("");
  const [showMoveSelect, setShowMoveSelect] = useState(false);

  const addUngroupedFlag = () => {
    const newFlag: FeatureFlag = {
      id: `ungrouped-${Date.now()}`,
      name: "Nuova Feature Flag",
      key: `new_flag_${Date.now()}`,
      description: "Descrizione della feature flag",
      enabled: false,
      targets: [],
    };
    setUngroupedFlags((prev) => [...prev, newFlag]);
    openEditPage(null, newFlag);
  };

  const addFlagToGroup = (groupId: string) => {
    const newFlag: FeatureFlag = {
      id: `${groupId}-${Date.now()}`,
      name: "Nuova Feature Flag",
      key: `new_flag_${Date.now()}`,
      description: "Descrizione della feature flag",
      enabled: false,
      targets: [],
    };
    setFeatureFlagsGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, flags: [...group.flags, newFlag] }
          : group
      )
    );
    openEditPage(groupId, newFlag);
  };

  const openGroupModal = (groupId?: string) => {
    if (groupId) {
      // Modifica gruppo esistente
      const group = featureFlagsGroups.find((g) => g.id === groupId);
      if (group) {
        setEditingGroupId(groupId);
        setGroupName(group.name);
        setGroupDescription(group.description);
      }
    } else {
      // Crea nuovo gruppo
      setEditingGroupId(null);
      setGroupName("");
      setGroupDescription("");
    }
    setIsGroupModalOpen(true);
  };

  const closeGroupModal = () => {
    setIsGroupModalOpen(false);
    setEditingGroupId(null);
    setGroupName("");
    setGroupDescription("");
  };

  const saveGroup = () => {
    if (!groupName.trim()) return;

    if (editingGroupId) {
      // Modifica gruppo esistente
      setFeatureFlagsGroups((prev) =>
        prev.map((group) =>
          group.id === editingGroupId
            ? {
                ...group,
                name: groupName,
                description: groupDescription,
              }
            : group
        )
      );
    } else {
      // Crea nuovo gruppo
      const newGroup: FeatureFlagGroup = {
        id: Date.now().toString(),
        name: groupName,
        description: groupDescription,
        flags: [],
      };
      setFeatureFlagsGroups((prev) => [...prev, newGroup]);
    }
    closeGroupModal();
  };

  const toggleMultiSelectMode = () => {
    if (multiSelectMode) {
      // Disattiva modalità selezione multipla
      setMultiSelectMode(false);
      setSelectedFlags([]);
      setBulkActionTargetGroup("");
      setShowMoveSelect(false);
    } else {
      // Attiva modalità selezione multipla
      setMultiSelectMode(true);
      setSelectedFlags([]);
      setBulkActionTargetGroup("");
      setShowMoveSelect(false);
    }
  };

  const toggleFlagSelection = (flagId: string, groupId: string | null) => {
    setSelectedFlags((prev) => {
      const exists = prev.some(
        (f) => f.flagId === flagId && f.groupId === groupId
      );
      if (exists) {
        return prev.filter(
          (f) => !(f.flagId === flagId && f.groupId === groupId)
        );
      } else {
        return [...prev, { flagId, groupId }];
      }
    });
  };

  const isFlagSelected = (flagId: string, groupId: string | null) => {
    return selectedFlags.some(
      (f) => f.flagId === flagId && f.groupId === groupId
    );
  };

  const selectAllFlags = () => {
    const allFlags: { flagId: string; groupId: string | null }[] = [];
    // Aggiungi flag senza gruppo
    ungroupedFlags.forEach((flag) => {
      allFlags.push({ flagId: flag.id, groupId: null });
    });
    // Aggiungi flag dai gruppi
    featureFlagsGroups.forEach((group) => {
      group.flags.forEach((flag) => {
        allFlags.push({ flagId: flag.id, groupId: group.id });
      });
    });
    setSelectedFlags(allFlags);
  };

  const deselectAllFlags = () => {
    setSelectedFlags([]);
  };

  const handleBulkAction = (action: string) => {
    if (selectedFlags.length === 0) return;

    switch (action) {
      case "delete":
        deleteFlags(selectedFlags);
        break;
      case "move":
        if (bulkActionTargetGroup) {
          moveFlagsToGroup(selectedFlags, bulkActionTargetGroup);
        }
        break;
      default:
        break;
    }

    // Reset dopo l'azione
    setSelectedFlags([]);
    setBulkActionTargetGroup("");
    setShowMoveSelect(false);
    setMultiSelectMode(false);
  };

  const deleteFlags = (
    flagsToDelete: { flagId: string; groupId: string | null }[]
  ) => {
    flagsToDelete.forEach(({ flagId, groupId }) => {
      if (groupId === null) {
        setUngroupedFlags((prev) => prev.filter((flag) => flag.id !== flagId));
      } else {
        setFeatureFlagsGroups((prev) =>
          prev.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  flags: group.flags.filter((flag) => flag.id !== flagId),
                }
              : group
          )
        );
      }
    });
  };

  const moveFlagsToGroup = (
    flagsToMove: { flagId: string; groupId: string | null }[],
    targetGroupId: string
  ) => {
    const targetId = targetGroupId === "ungrouped" ? null : targetGroupId;

    // Raggruppa per gruppo sorgente
    const flagsBySource: {
      [key: string]: { flags: FeatureFlag[]; groupId: string | null };
    } = {};

    flagsToMove.forEach(({ flagId, groupId }) => {
      const key = groupId || "ungrouped";
      if (!flagsBySource[key]) {
        flagsBySource[key] = { flags: [], groupId };
      }

      let flag: FeatureFlag | undefined;
      if (groupId === null) {
        flag = ungroupedFlags.find((f) => f.id === flagId);
      } else {
        const group = featureFlagsGroups.find((g) => g.id === groupId);
        flag = group?.flags.find((f) => f.id === flagId);
      }

      if (flag) {
        flagsBySource[key].flags.push(flag);
      }
    });

    // Rimuovi dalle sorgenti
    Object.values(flagsBySource).forEach(({ flags, groupId }) => {
      const flagIds = flags.map((f) => f.id);
      if (groupId === null) {
        setUngroupedFlags((prev) =>
          prev.filter((flag) => !flagIds.includes(flag.id))
        );
      } else {
        setFeatureFlagsGroups((prev) =>
          prev.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  flags: group.flags.filter(
                    (flag) => !flagIds.includes(flag.id)
                  ),
                }
              : group
          )
        );
      }
    });

    // Aggiungi alla destinazione
    const allFlagsToMove = Object.values(flagsBySource).flatMap(
      ({ flags }) => flags
    );
    if (targetId === null) {
      setUngroupedFlags((prev) => [...prev, ...allFlagsToMove]);
    } else {
      setFeatureFlagsGroups((prev) =>
        prev.map((group) =>
          group.id === targetId
            ? { ...group, flags: [...group.flags, ...allFlagsToMove] }
            : group
        )
      );
    }
  };

  const toggleFlag = (groupId: string | null, flagId: string) => {
    if (groupId === null) {
      // Feature flag senza gruppo
      setUngroupedFlags((prev) =>
        prev.map((flag) => {
          if (flag.id === flagId) {
            const newEnabled = !flag.enabled;
            // Se la flag viene disattivata, disattiva anche tutti i target
            if (!newEnabled && flag.targets) {
              return {
                ...flag,
                enabled: newEnabled,
                targets: flag.targets.map((target) => ({
                  ...target,
                  flagValue: false,
                })),
              };
            }
            return { ...flag, enabled: newEnabled };
          }
          return flag;
        })
      );
    } else {
      // Feature flag con gruppo
      setFeatureFlagsGroups((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? {
                ...group,
                flags: group.flags.map((flag) => {
                  if (flag.id === flagId) {
                    const newEnabled = !flag.enabled;
                    // Se la flag viene disattivata, disattiva anche tutti i target
                    if (!newEnabled && flag.targets) {
                      return {
                        ...flag,
                        enabled: newEnabled,
                        targets: flag.targets.map((target) => ({
                          ...target,
                          flagValue: false,
                        })),
                      };
                    }
                    return { ...flag, enabled: newEnabled };
                  }
                  return flag;
                }),
              }
            : group
        )
      );
    }
  };

  const deleteFlag = (groupId: string | null, flagId: string) => {
    if (groupId === null) {
      // Elimina feature flag senza gruppo
      setUngroupedFlags((prev) => prev.filter((flag) => flag.id !== flagId));
    } else {
      // Elimina feature flag con gruppo
      setFeatureFlagsGroups((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? {
                ...group,
                flags: group.flags.filter((flag) => flag.id !== flagId),
              }
            : group
        )
      );
    }
  };

  const deleteGroup = (groupId: string) => {
    setFeatureFlagsGroups((prev) =>
      prev.filter((group) => group.id !== groupId)
    );
  };

  const openEditPage = (groupId: string | null, flag: FeatureFlag) => {
    setSelectedFlag({ groupId, flag });
    setIsEditingFlag(true);
  };

  const closeEditPage = () => {
    setIsEditingFlag(false);
    setSelectedFlag(null);
  };

  const saveFlag = (
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
  ) => {
    if (groupId === null) {
      // Salva feature flag senza gruppo
      setUngroupedFlags((prev) =>
        prev.map((flag) =>
          flag.id === flagId
            ? {
                ...flag,
                name,
                key,
                description,
                targets: targetingRules,
              }
            : flag
        )
      );
    } else {
      // Salva feature flag con gruppo
      setFeatureFlagsGroups((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? {
                ...group,
                flags: group.flags.map((flag) =>
                  flag.id === flagId
                    ? {
                        ...flag,
                        name,
                        key,
                        description,
                        targets: targetingRules,
                      }
                    : flag
                ),
              }
            : group
        )
      );
    }
    console.log("Saved targeting rules:", targetingRules);
    console.log("Saved rules:", rules);
    closeEditPage();
  };

  // Funzione per generare nome leggibile del target
  const getTargetName = (target: TargetingRule) => {
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

  // Toggle del valore di un target specifico
  const toggleTarget = (
    groupId: string | null,
    flagId: string,
    targetId: string
  ) => {
    if (groupId === null) {
      // Target di feature flag senza gruppo
      setUngroupedFlags((prev) =>
        prev.map((flag) =>
          flag.id === flagId
            ? {
                ...flag,
                targets: flag.targets?.map((target) =>
                  target.id === targetId
                    ? { ...target, flagValue: !target.flagValue }
                    : target
                ),
              }
            : flag
        )
      );
    } else {
      // Target di feature flag con gruppo
      setFeatureFlagsGroups((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? {
                ...group,
                flags: group.flags.map((flag) =>
                  flag.id === flagId
                    ? {
                        ...flag,
                        targets: flag.targets?.map((target) =>
                          target.id === targetId
                            ? { ...target, flagValue: !target.flagValue }
                            : target
                        ),
                      }
                    : flag
                ),
              }
            : group
        )
      );
    }
  };

  // Se siamo in modalità modifica, mostra la pagina di modifica
  if (isEditingFlag && selectedFlag) {
    return (
      <FeatureFlagEditor
        selectedFlag={selectedFlag}
        onClose={closeEditPage}
        onSave={saveFlag}
      />
    );
  }

  // Vista principale con la lista di feature flags
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-default-900">Feature Flags</h2>
          <p className="text-sm text-default-600 mt-1">
            Gestisci i gruppi e le feature flag per il progetto
          </p>
        </div>
        <div className="flex gap-2">
          {multiSelectMode ? (
            <Button
              onClick={toggleMultiSelectMode}
              variant="light"
              size="sm"
              startContent={<Icon icon="lucide:x" width={16} />}
            >
              Annulla Selezione
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleMultiSelectMode}
                variant="light"
                size="sm"
                startContent={<Icon icon="lucide:check-square" width={16} />}
              >
                Seleziona
              </Button>
              <Button
                onClick={addUngroupedFlag}
                variant="solid"
                color="primary"
                size="sm"
                startContent={<Icon icon="lucide:flag" width={16} />}
              >
                Nuova Flag
              </Button>
              <Button
                onClick={() => openGroupModal()}
                variant="solid"
                color="primary"
                size="sm"
                startContent={<Icon icon="lucide:plus" width={16} />}
              >
                Nuovo Gruppo
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Toolbar globale per selezione multipla */}
      {multiSelectMode && (
        <Card
          className="w-full border border-default-200 transition-all duration-200"
          shadow="none"
        >
          <CardBody className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-default-700 whitespace-nowrap">
                  {selectedFlags.length} flag selezionata
                  {selectedFlags.length !== 1 ? "e" : ""}
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="light" onPress={selectAllFlags}>
                    Seleziona Tutte
                  </Button>
                  <Button size="sm" variant="light" onPress={deselectAllFlags}>
                    Deseleziona
                  </Button>
                </div>
              </div>
              {selectedFlags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  {showMoveSelect ? (
                    <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="lucide:move"
                          width={16}
                          className="text-primary"
                        />
                        <span className="text-sm font-medium text-default-700 whitespace-nowrap">
                          Sposta {selectedFlags.length} flag
                        </span>
                      </div>
                      <Select
                        placeholder="Scegli destinazione..."
                        selectedKeys={
                          bulkActionTargetGroup ? [bulkActionTargetGroup] : []
                        }
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string;
                          setBulkActionTargetGroup(selected || "");
                        }}
                        variant="bordered"
                        color="default"
                        className="w-full sm:w-56"
                        startContent={
                          <Icon
                            icon="lucide:layers"
                            width={14}
                            className="text-default-400"
                          />
                        }
                      >
                        <SelectItem
                          key="ungrouped"
                          startContent={
                            <div className="p-1 rounded bg-primary-900">
                              <Icon
                                icon="lucide:flag"
                                width={14}
                                className="text-default-50"
                              />
                            </div>
                          }
                          textValue="Senza Gruppo"
                        >
                          Senza Gruppo
                        </SelectItem>
                        {
                          featureFlagsGroups.map((g) => (
                            <SelectItem
                              key={g.id}
                              startContent={
                                <div className="p-1 rounded bg-primary-900">
                                  <Icon
                                    icon="lucide:layers"
                                    width={14}
                                    className="text-default-50"
                                  />
                                </div>
                              }
                              textValue={g.name}
                            >
                              {g.name}
                            </SelectItem>
                          )) as any
                        }
                      </Select>
                      {bulkActionTargetGroup && (
                        <Button
                          size="sm"
                          color="primary"
                          onPress={() => handleBulkAction("move")}
                          startContent={<Icon icon="lucide:check" width={14} />}
                        >
                          Conferma
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => {
                          setShowMoveSelect(false);
                          setBulkActionTargetGroup("");
                        }}
                      >
                        <Icon icon="lucide:x" width={14} />
                      </Button>
                    </div>
                  ) : (
                    <Select
                      placeholder="Operazioni"
                      selectedKeys={[]}
                      onSelectionChange={(keys) => {
                        const action = Array.from(keys)[0] as string;
                        if (action === "delete") {
                          handleBulkAction(action);
                        } else if (action === "move") {
                          setShowMoveSelect(true);
                        }
                      }}
                      variant="bordered"
                      size="sm"
                      className="w-full sm:w-40"
                    >
                      <SelectItem
                        key="move"
                        startContent={<Icon icon="lucide:move" width={14} />}
                      >
                        Sposta
                      </SelectItem>
                      <SelectItem
                        key="delete"
                        startContent={<Icon icon="lucide:trash-2" width={14} />}
                      >
                        Elimina
                      </SelectItem>
                    </Select>
                  )}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Group Modal */}
      <Modal
        isOpen={isGroupModalOpen}
        onClose={closeGroupModal}
        size="lg"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            {editingGroupId ? "Modifica Gruppo" : "Nuovo Gruppo"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Nome Gruppo"
                placeholder="es. Funzionalità UI"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                variant="bordered"
                isRequired
              />
              <Textarea
                label="Descrizione"
                placeholder="Descrizione del gruppo..."
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                variant="bordered"
                minRows={3}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closeGroupModal}>
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={saveGroup}
              isDisabled={!groupName.trim()}
            >
              {editingGroupId ? "Salva Modifiche" : "Crea Gruppo"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Ungrouped Flags Section */}
      <div className="space-y-3">
        {ungroupedFlags.length > 0 && (
          <>
            {/* Titolo sezione */}
            {!multiSelectMode && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="lucide:flag"
                    width={20}
                    className="text-default-600"
                  />
                  <h3 className="text-lg font-semibold text-default-900">
                    Feature Flags Senza Gruppo
                  </h3>
                  <Chip size="sm" variant="flat" color="default">
                    {ungroupedFlags.length}
                  </Chip>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-5">
              {ungroupedFlags.map((flag) => (
                <Card
                  key={flag.id}
                  className="w-full border border-default-200 transition-all duration-200"
                  shadow="none"
                >
                  <CardBody className="p-4 space-y-3">
                    {/* Bottoni modifica ed elimina in alto a destra */}
                    {!multiSelectMode && (
                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => openEditPage(null, flag)}
                        >
                          <Icon icon="lucide:edit-3" width={16} />
                        </Button>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => deleteFlag(null, flag.id)}
                        >
                          <Icon icon="lucide:trash-2" width={16} />
                        </Button>
                      </div>
                    )}

                    <div
                      className={`flex items-center justify-between gap-4 ${
                        multiSelectMode ? "" : "pr-16"
                      }`}
                    >
                      {/* Checkbox quando modalità selezione multipla è attiva */}
                      {multiSelectMode && (
                        <div className="flex-shrink-0">
                          <Checkbox
                            isSelected={isFlagSelected(flag.id, null)}
                            onValueChange={() =>
                              toggleFlagSelection(flag.id, null)
                            }
                          />
                        </div>
                      )}

                      {/* Sezione principale con nome e descrizione */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-semibold text-default-900 truncate">
                            {flag.name}
                          </h4>
                          <Chip
                            size="sm"
                            variant="flat"
                            className="font-mono text-xs"
                            color="default"
                          >
                            {flag.key}
                          </Chip>
                        </div>
                        <p className="text-xs text-default-500">
                          {flag.description}
                        </p>
                      </div>

                      {/* Switch per enable/disable */}
                      <div className="flex flex-col items-end gap-3">
                        <Chip
                          size="sm"
                          variant="flat"
                          color={flag.enabled ? "success" : "default"}
                        >
                          {flag.enabled ? "Attiva" : "Disattiva"}
                        </Chip>
                        <Switch
                          size="sm"
                          color="primary"
                          isSelected={flag.enabled}
                          onValueChange={() => {
                            toggleFlag(null, flag.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Target list collassabile */}
                    {flag.targets && flag.targets.length > 0 && (
                      <div className="pt-3 border-t border-default-100">
                        <Accordion variant="light" className="px-0">
                          <AccordionItem
                            key="targets"
                            aria-label={`Target di ${flag.name}`}
                            title={
                              <div className="flex items-center gap-2">
                                <Icon
                                  icon="lucide:target"
                                  width={14}
                                  className="text-default-400"
                                />
                                <span className="text-xs font-medium text-default-500">
                                  Target ({flag.targets.length})
                                </span>
                              </div>
                            }
                            classNames={{
                              title: "text-xs",
                              trigger: "py-0 px-0",
                              content: "pt-2 pb-0 px-0",
                            }}
                          >
                            <div className="space-y-2">
                              {flag.targets.map((target) => (
                                <div
                                  key={target.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-default-50 hover:bg-default-100 transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    {target.name ? (
                                      <>
                                        <div className="text-xs font-medium text-default-900 truncate">
                                          {target.name}
                                        </div>
                                        <div className="text-[10px] text-default-500 truncate">
                                          {getTargetName(target)}
                                        </div>
                                      </>
                                    ) : (
                                      <span className="text-xs text-default-700 truncate">
                                        {getTargetName(target)}
                                      </span>
                                    )}
                                  </div>
                                  <Switch
                                    size="sm"
                                    isSelected={target.flagValue}
                                    isDisabled={!flag.enabled}
                                    onValueChange={() => {
                                      toggleTarget(null, flag.id, target.id);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              ))}
                            </div>
                          </AccordionItem>
                        </Accordion>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Groups List */}
      <div className="space-y-3">
        {featureFlagsGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-default border-2 border-dashed border-default-200 rounded-xl">
            <div className="p-4 rounded-full bg-primary-50 mb-4">
              <Icon icon="lucide:layers" width={32} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-default-900 mb-2">
              Nessun Gruppo Configurato
            </h3>
            <p className="text-sm text-default-500 mb-6 text-center max-w-md">
              Organizza le tue feature flag in gruppi per una gestione più
              efficiente. Crea il tuo primo gruppo per iniziare.
            </p>
            <Button
              onClick={() => openGroupModal()}
              variant="solid"
              color="primary"
              size="sm"
              startContent={<Icon icon="lucide:plus" width={16} />}
            >
              Crea Primo Gruppo
            </Button>
          </div>
        ) : (
          <Accordion variant="bordered" selectionMode="multiple">
            {featureFlagsGroups.map((group) => (
              <AccordionItem
                key={group.id}
                aria-label={group.name}
                title={
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-1">
                      <h3 className="font-semibold text-default-900">
                        {group.name}
                      </h3>
                    </div>
                    <span className="text-sm font-medium text-default-500">
                      {group.flags.length} Flag
                      {group.flags.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        color="primary"
                        variant="light"
                        isIconOnly
                        onClick={(e) => {
                          e.stopPropagation();
                          openGroupModal(group.id);
                        }}
                        title="Modifica gruppo"
                      >
                        <Icon icon="lucide:edit-2" width={16} />
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGroup(group.id);
                        }}
                        isIconOnly
                        variant="light"
                        color="danger"
                        title="Elimina gruppo"
                      >
                        <Icon icon="lucide:trash-2" width={16} />
                      </Button>
                    </div>
                  </div>
                }
                subtitle={
                  <p className="text-sm text-default-600">
                    {group.description}
                  </p>
                }
              >
                <div className="p-4">
                  {/* Toolbar locale rimossa - ora è globale */}

                  {group.flags.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      <div className="p-3 rounded-full bg-primary-50 mb-3">
                        <Icon
                          icon="lucide:flag-off"
                          width={24}
                          className="text-primary"
                        />
                      </div>
                      <p className="text-sm font-medium text-default-700 mb-1">
                        Nessuna Feature Flag
                      </p>
                      <p className="text-xs text-default-500 mb-4 text-center">
                        Questo gruppo è vuoto. Aggiungi la tua prima feature
                        flag per iniziare.
                      </p>
                      <Button
                        onClick={() => addFlagToGroup(group.id)}
                        variant="solid"
                        color="primary"
                        size="sm"
                        startContent={<Icon icon="lucide:plus" width={14} />}
                      >
                        Aggiungi Feature Flag
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {group.flags.map((flag) => (
                        <Card
                          key={flag.id}
                          className="w-full border border-default-200 transition-all duration-200"
                          shadow="none"
                        >
                          <CardBody className="p-4 space-y-3">
                            {/* Bottoni modifica ed elimina in alto a destra */}
                            {!multiSelectMode && (
                              <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  onPress={() => openEditPage(group.id, flag)}
                                >
                                  <Icon icon="lucide:edit-3" width={16} />
                                </Button>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  onPress={() => deleteFlag(group.id, flag.id)}
                                >
                                  <Icon icon="lucide:trash-2" width={16} />
                                </Button>
                              </div>
                            )}

                            <div
                              className={`flex items-center justify-between gap-4 ${
                                multiSelectMode ? "" : "pr-16"
                              }`}
                            >
                              {/* Checkbox quando modalità selezione multipla è attiva */}
                              {multiSelectMode && (
                                <div className="flex-shrink-0">
                                  <Checkbox
                                    isSelected={isFlagSelected(
                                      flag.id,
                                      group.id
                                    )}
                                    onValueChange={() =>
                                      toggleFlagSelection(flag.id, group.id)
                                    }
                                  />
                                </div>
                              )}

                              {/* Sezione principale con nome e descrizione */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-base font-semibold text-default-900 truncate">
                                    {flag.name}
                                  </h4>
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    className="font-mono text-xs"
                                    color="default"
                                  >
                                    {flag.key}
                                  </Chip>
                                </div>
                                <p className="text-xs text-default-500">
                                  {flag.description}
                                </p>
                              </div>

                              {/* Switch per enable/disable */}
                              <div className="flex flex-col items-end gap-3">
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color={flag.enabled ? "success" : "default"}
                                >
                                  {flag.enabled ? "Attiva" : "Disattiva"}
                                </Chip>
                                <Switch
                                  size="sm"
                                  color="primary"
                                  isSelected={flag.enabled}
                                  onValueChange={() => {
                                    toggleFlag(group.id, flag.id);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>

                            {/* Target list collassabile */}
                            {flag.targets && flag.targets.length > 0 && (
                              <div className="pt-3 border-t border-default-100">
                                <Accordion variant="light" className="px-0">
                                  <AccordionItem
                                    key="targets"
                                    aria-label={`Target di ${flag.name}`}
                                    title={
                                      <div className="flex items-center gap-2">
                                        <Icon
                                          icon="lucide:target"
                                          width={14}
                                          className="text-default-400"
                                        />
                                        <span className="text-xs font-medium text-default-500">
                                          Target ({flag.targets.length})
                                        </span>
                                      </div>
                                    }
                                    classNames={{
                                      title: "text-xs",
                                      trigger: "py-0 px-0",
                                      content: "pt-2 pb-0 px-0",
                                    }}
                                  >
                                    <div className="space-y-2">
                                      {flag.targets.map((target) => (
                                        <div
                                          key={target.id}
                                          className="flex items-center justify-between p-2 rounded-lg bg-default-50 hover:bg-default-100 transition-colors"
                                        >
                                          <div className="flex-1 min-w-0">
                                            {target.name ? (
                                              <>
                                                <div className="text-xs font-medium text-default-900 truncate">
                                                  {target.name}
                                                </div>
                                                <div className="text-[10px] text-default-500 truncate">
                                                  {getTargetName(target)}
                                                </div>
                                              </>
                                            ) : (
                                              <span className="text-xs text-default-700 truncate">
                                                {getTargetName(target)}
                                              </span>
                                            )}
                                          </div>
                                          <Switch
                                            size="sm"
                                            isSelected={target.flagValue}
                                            isDisabled={!flag.enabled}
                                            onValueChange={() => {
                                              toggleTarget(
                                                group.id,
                                                flag.id,
                                                target.id
                                              );
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            )}
                          </CardBody>
                        </Card>
                      ))}
                      <Button
                        onClick={() => addFlagToGroup(group.id)}
                        variant="solid"
                        color="primary"
                        size="sm"
                        startContent={<Icon icon="lucide:plus" width={14} />}
                        className="w-fit"
                      >
                        Aggiungi Flag
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
