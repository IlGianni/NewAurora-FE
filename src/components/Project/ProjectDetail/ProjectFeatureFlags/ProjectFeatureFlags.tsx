import { useState, useEffect, useMemo } from "react";
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
  Popover,
} from "@heroui/react";
import {
  Card,
  CardBody,
  Chip,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import axios from "axios";
import type {
  Feature_Flag_Group,
  Feature_Flag,
  Feature_Flag_Target,
} from "../../../../types";

interface ProjectFeatureFlagsProps {
  projectId: string;
}

// Tipo helper per il mapping dei dati dal server (aggiunge group_id come alias)
type FeatureFlagWithGroupId = Feature_Flag & {
  group_id?: string | number | null; // Alias per feature_flag_group_id per compatibilità
};

// Tipo helper per i gruppi con le flag (aggiunge id come alias e flags come array)
type FeatureFlagGroupWithFlags = Omit<Feature_Flag_Group, "feature_flags"> & {
  id: string | number; // Alias per feature_flag_group_id per compatibilità
  flags: FeatureFlagWithGroupId[];
};

export default function ProjectFeatureFlags({
  projectId,
}: ProjectFeatureFlagsProps) {
  const [allFeatureFlags, setAllFeatureFlags] = useState<
    FeatureFlagWithGroupId[]
  >([]);
  const [featureFlagsGroups, setFeatureFlagsGroups] = useState<
    Omit<FeatureFlagGroupWithFlags, "flags">[]
  >([]);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  useEffect(() => {
    const loadData = async () => {
      // Esegui entrambi i fetch in modo indipendente
      // Se uno fallisce, l'altro viene comunque eseguito
      await Promise.allSettled([
        fetchFeatureFlags(),
        fetchFeatureFlagsGroups(),
      ]);
    };
    loadData();
  }, []);

  // Calcola le flag per ogni gruppo usando useMemo per garantire che siano sempre aggiornate
  const groupsWithFlags = useMemo(() => {
    return featureFlagsGroups.map((group) => {
      // Filtra le flag che appartengono a questo gruppo
      // Confronta sia come stringa che come numero per gestire diversi formati
      const groupFlags = allFeatureFlags.filter((flag) => {
        if (!flag.group_id) return false;
        // Confronta come stringa per gestire eventuali differenze di tipo
        const matches = String(flag.group_id) === String(group.id);
        if (matches) {
          console.log(
            `Flag "${flag.name}" (group_id: ${flag.group_id}) assegnata al gruppo "${group.name}" (id: ${group.id})`
          );
        }
        return matches;
      });
      console.log(
        `Gruppo "${group.name}" (id: ${group.id}): ${groupFlags.length} flag trovate`
      );
      return {
        ...group,
        flags: groupFlags,
      };
    });
  }, [featureFlagsGroups, allFeatureFlags]);

  // Calcola le flag non raggruppate usando useMemo per ottimizzare le performance
  const ungroupedFlags = useMemo(() => {
    return allFeatureFlags.filter((flag) => {
      // Se non ha group_id, è non raggruppata
      if (
        !flag.group_id ||
        flag.group_id === null ||
        flag.group_id === undefined ||
        flag.group_id === ""
      ) {
        return true;
      }
      // Verifica se il group_id corrisponde a un gruppo esistente
      const belongsToGroup = groupsWithFlags.some(
        (group) => String(group.id) === String(flag.group_id)
      );
      // Se non appartiene a nessun gruppo esistente, è non raggruppata
      return !belongsToGroup;
    });
  }, [allFeatureFlags, groupsWithFlags]);

  async function fetchFeatureFlags() {
    try {
      const response = await axios.get("/project/GET/get-all-feature-flags", {
        params: {
          project_id: projectId,
        },
      });
      if (response.status === 200 && response.data) {
        const flags = Array.isArray(response.data.feature_flags)
          ? response.data.feature_flags.map(
              (flag: Feature_Flag) =>
                ({
                  ...flag,
                  // Mappa feature_flag_group_id a group_id per compatibilità
                  group_id: flag.feature_flag_group_id || null,
                } as FeatureFlagWithGroupId)
            )
          : [];
        console.log("Feature flags caricate:", flags.length);
        flags.forEach((flag: FeatureFlagWithGroupId) => {
          console.log(
            `  - Flag: ${flag.name}, group_id: ${
              flag.group_id
            } (tipo: ${typeof flag.group_id}), feature_flag_group_id: ${
              flag.feature_flag_group_id
            }`
          );
        });
        setAllFeatureFlags(flags);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log("Feature flags not found (404) - impostando array vuoto");
        setAllFeatureFlags([]);
      } else {
        console.error(
          "Error fetching feature flags:",
          error.response?.data || error.message
        );
        // In caso di altri errori, imposta comunque un array vuoto per non bloccare l'UI
        setAllFeatureFlags([]);
      }
    }
  }

  async function fetchFeatureFlagsGroups() {
    try {
      const response = await axios.get(
        "/project/GET/get-all-feature-flag-groups",
        {
          params: {
            project_id: projectId,
          },
        }
      );

      if (response.status === 200 && response.data) {
        const groups = Array.isArray(response.data.feature_flag_groups)
          ? response.data.feature_flag_groups.map(
              (group: Feature_Flag_Group) => ({
                id: group.feature_flag_group_id,
                name: group.name,
                description: group.description || "",
                flags: [], // Verrà popolato dal useEffect
              })
            )
          : [];
        console.log("Gruppi caricati:", groups.length);
        groups.forEach((group: any) => {
          console.log(
            `  - Gruppo: ${group.name}, id: ${
              group.id
            } (tipo: ${typeof group.id})`
          );
        });
        setFeatureFlagsGroups(groups);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(
          "Feature flags groups not found (404) - impostando array vuoto"
        );
        setFeatureFlagsGroups([]);
      } else {
        console.error(
          "Error fetching feature flags groups:",
          error.response?.data || error.message
        );
        // In caso di altri errori, imposta comunque un array vuoto per non bloccare l'UI
        setFeatureFlagsGroups([]);
      }
    }
  }

  function closeCreateGroupModal() {
    setIsCreateGroupModalOpen(false);
    setGroupName("");
    setGroupDescription("");
  }

  function closeEditGroupModal() {
    setIsEditGroupModalOpen(false);
    setEditingGroupId(null);
    setGroupName("");
    setGroupDescription("");
  }

  async function createGroup() {
    try {
      const response = await axios.post(
        "/project/POST/create-feature-flag-group",
        {
          feature_flag_group_data: {
            project_id: projectId,
            name: groupName,
            description: groupDescription,
          },
        }
      );

      if (response.status === 200 && response.data) {
        fetchFeatureFlags();
        fetchFeatureFlagsGroups();
        closeCreateGroupModal();
      }
    } catch (error: any) {
      console.error("Error creating group:", error.response?.data);
      throw error;
    }
  }

  async function updateGroup() {
    if (!editingGroupId) return;

    try {
      const response = await axios.put(
        "/project/UPDATE/update-feature-flag-group",
        {
          feature_flag_group_data: {
            feature_flag_group_id: editingGroupId,
            name: groupName,
            description: groupDescription,
          },
        }
      );

      if (response.status === 200 && response.data) {
        fetchFeatureFlags();
        fetchFeatureFlagsGroups();
        closeEditGroupModal();
      }
    } catch (error: any) {
      console.error("Error updating group:", error.response?.data);
      throw error;
    }
  }

  function createNewFlag() {
    location.href = `/projects/${projectId}/feature-flags/new-flag/null`;
  }

  function openEditPage(flag: FeatureFlagWithGroupId) {
    const flagId = flag.key;
    location.href = `/projects/${projectId}/feature-flags/${flagId}`;
  }

  const getTargetName = (
    target:
      | Feature_Flag_Target
      | {
          name?: string;
          type: string;
          operator: string;
          value: string;
        }
  ) => {
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

  async function deleteFlag(flagId: number) {
    try {
      console.log("Deleting flag:", flagId);
      const response = await axios.delete(
        "/project/DELETE/delete-feature-flag/",
        {
          data: {
            feature_flag_id: flagId,
          },
        }
      );
      if (response.status === 200) {
        fetchFeatureFlags();
        fetchFeatureFlagsGroups();
      }
    } catch (error: any) {
      console.error("Error deleting flag:", error.response?.data);
    }
  }

  async function toggleFlag(flagId: number) {
    try {
      const flag = allFeatureFlags.find((f) => f.feature_flag_id === flagId);
      if (!flag) return;

      const response = await axios.post(
        `/project/POST/change-feature-flag-state`,
        {
          feature_flag_id: flagId,
          value: !flag.enabled,
        }
      );
      if (response.status === 200) {
        fetchFeatureFlags();
        fetchFeatureFlagsGroups();
      }
    } catch (error: any) {
      console.error("Error toggling flag:", error.response?.data);
    }
  }

  async function toggleTarget(targetId: number, value: boolean) {
    try {
      console.log("Toggling target:", targetId, value);
      const response = await axios.put(
        `/project/UPDATE/update-targeting-rule`,
        {
          target_id: targetId,
          value: value,
        }
      );
      if (response.status === 200) {
        fetchFeatureFlags();
        fetchFeatureFlagsGroups();
      }
    } catch (error: any) {
      console.error("Error toggling target:", error.response?.data);
    }
  }

  function openCreateGroupModal() {
    setGroupName("");
    setGroupDescription("");
    setIsCreateGroupModalOpen(true);
  }

  function openEditGroupModal(groupId: string | number) {
    const group = groupsWithFlags.find((g) => String(g.id) === String(groupId));
    if (group) {
      setEditingGroupId(String(groupId));
      setGroupName(group.name);
      setGroupDescription(group.description || "");
      setIsEditGroupModalOpen(true);
    }
  }

  async function deleteGroup(groupId: string | number) {
    try {
      const response = await axios.delete(
        `/project/DELETE/delete-feature-flag-group/`,
        {
          data: {
            feature_flag_group_id: groupId,
          },
        }
      );
      if (response.status === 200) {
        fetchFeatureFlags();
        fetchFeatureFlagsGroups();
      }
    } catch (error: any) {
      console.error("Error deleting group:", error.response?.data);
    }
  }

  function addFlagToGroup(groupId: string | number | null) {
    const groupIdStr = groupId === null ? null : String(groupId);
    location.href = `/projects/${projectId}/feature-flags/new-flag/${groupIdStr}`;
  }

  async function moveFlagToGroup(flagId: number, newGroupId: string | null) {
    try {
      const groupIdToSet =
        newGroupId === "null" || newGroupId === null ? null : newGroupId;

      const response = await axios.put(
        "/project/UPDATE/update-feature-flag-group-state",
        {
          feature_flag_id: flagId,
          feature_flag_group_id: groupIdToSet,
        }
      );

      if (response.status === 200) {
        console.log(
          `Flag ${flagId} successfully moved to group: ${groupIdToSet}`
        );
        await fetchFeatureFlags();
        await fetchFeatureFlagsGroups();
      }
    } catch (error: any) {
      console.error(
        "Error moving flag to group:",
        error.response?.data || error.message
      );
    }
  }

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
          <Button
            variant="solid"
            color="primary"
            startContent={<Icon icon="lucide:flag" width={16} />}
            onPress={() => addFlagToGroup(null)}
          >
            Nuova Flag
          </Button>
          <Button
            variant="solid"
            color="primary"
            startContent={<Icon icon="lucide:plus" width={16} />}
            onPress={openCreateGroupModal}
          >
            Nuovo Gruppo
          </Button>
        </div>
      </div>

      {/* Create Group Modal */}
      <Modal
        isOpen={isCreateGroupModalOpen}
        onClose={closeCreateGroupModal}
        size="lg"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Nuovo Gruppo
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
            <Button variant="light" onPress={closeCreateGroupModal}>
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={createGroup}
              isDisabled={!groupName.trim()}
            >
              Crea Gruppo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Group Modal */}
      <Modal
        isOpen={isEditGroupModalOpen}
        onClose={closeEditGroupModal}
        size="lg"
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Modifica Gruppo
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
            <Button variant="light" onPress={closeEditGroupModal}>
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={updateGroup}
              isDisabled={!groupName.trim()}
            >
              Salva Modifiche
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Ungrouped Flags Section */}
      <div className="space-y-3">
        {ungroupedFlags.length > 0 ? (
          <>
            <div className="flex flex-col gap-5">
              {ungroupedFlags.map((flag) => (
                <Card
                  key={flag.feature_flag_id}
                  className="w-full border border-default-200 transition-all duration-200"
                  shadow="none"
                >
                  <CardBody className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      {/* Sezione principale con nome e descrizione */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor: flag.enabled ? "green" : "red",
                            }}
                          />

                          <h4 className="text-base font-semibold text-default-900 truncate">
                            {flag.name}
                          </h4>
                          <Chip
                            variant="bordered"
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
                        {/* Bottoni modifica ed elimina in alto a destra */}

                        <div className="flex items-center gap-1">
                          <Button
                            isIconOnly
                            variant="light"
                            color="primary"
                            onPress={() => openEditPage(flag)}
                          >
                            <Icon icon="lucide:edit-3" width={16} />
                          </Button>
                          <Button
                            isIconOnly
                            variant="light"
                            color="danger"
                            onPress={() => deleteFlag(flag.feature_flag_id)}
                          >
                            <Icon icon="lucide:trash-2" width={16} />
                          </Button>
                          <Popover showArrow>
                            <PopoverTrigger>
                              <Button
                                isIconOnly
                                variant="light"
                                color="primary"
                              >
                                <Icon icon="uil:exchange" width={16} />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                              <Select
                                className="w-72"
                                label="Gruppo"
                                placeholder="Seleziona un gruppo"
                                selectedKeys={[flag.group_id || "null"]}
                                onSelectionChange={(keys) => {
                                  const selectedGroupId = Array.from(
                                    keys
                                  )[0] as string;
                                  moveFlagToGroup(
                                    flag.feature_flag_id,
                                    selectedGroupId
                                  );
                                }}
                                variant="underlined"
                              >
                                <>
                                  <SelectItem key="null">
                                    Nessun gruppo
                                  </SelectItem>
                                  {featureFlagsGroups.map((group) => (
                                    <SelectItem key={group.id}>
                                      {group.name}
                                    </SelectItem>
                                  ))}
                                </>
                              </Select>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <Switch
                          color="success"
                          isSelected={flag.enabled}
                          onValueChange={() => {
                            toggleFlag(flag.feature_flag_id);
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
                                  key={target.target_id}
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
                                    color="success"
                                    isSelected={target.enabled}
                                    isDisabled={!flag.enabled}
                                    onValueChange={() => {
                                      toggleTarget(
                                        target.target_id,
                                        !target.enabled
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
            </div>
          </>
        ) : null}
      </div>

      {/* Groups List */}
      <div className="space-y-3">
        {/* Calcola il numero totale di feature flag */}
        {allFeatureFlags.length === 0 && featureFlagsGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 bg-gradient-to-br from-default-50 to-default-100 border-2 border-dashed border-default-300 rounded-2xl shadow-sm">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary-100 rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative p-6 rounded-full bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 shadow-lg">
                <Icon
                  icon="lucide:flag"
                  width={48}
                  className="text-primary-600"
                />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-default-900 mb-3">
              Nessuna Feature Flag
            </h3>
            <p className="text-sm text-default-600 mb-8 text-center max-w-md leading-relaxed">
              Inizia a gestire le funzionalità del tuo progetto creando la tua
              prima feature flag. Le feature flag ti permettono di controllare
              l'attivazione delle funzionalità in modo dinamico.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onPress={() => createNewFlag()}
                variant="solid"
                color="primary"
                size="lg"
                className="font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                startContent={<Icon icon="lucide:flag" width={18} />}
              >
                Crea Prima Feature Flag
              </Button>
              <Button
                onClick={openCreateGroupModal}
                variant="bordered"
                color="default"
                size="lg"
                className="font-medium"
                startContent={<Icon icon="lucide:layers" width={18} />}
              >
                Crea Gruppo
              </Button>
            </div>
          </div>
        ) : null}

        <Accordion variant="bordered" selectionMode="multiple">
          {groupsWithFlags.map((group: FeatureFlagGroupWithFlags) => (
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
                        openEditGroupModal(String(group.id));
                      }}
                      title="Modifica gruppo"
                    >
                      <Icon icon="lucide:edit-2" width={16} />
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGroup(String(group.id));
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
                <p className="text-sm text-default-600">{group.description}</p>
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
                      Questo gruppo è vuoto. Aggiungi la tua prima feature flag
                      per iniziare.
                    </p>
                    <Button
                      onPress={() => addFlagToGroup(String(group.id))}
                      variant="solid"
                      color="primary"
                      startContent={<Icon icon="lucide:plus" width={14} />}
                    >
                      Aggiungi Feature Flag
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5">
                    {group.flags.map((flag) => (
                      <Card
                        key={flag.feature_flag_id}
                        className="w-full border border-default-200 transition-all duration-200"
                        shadow="none"
                      >
                        <CardBody className="p-4 space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            {/* Sezione principale con nome e descrizione */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{
                                    backgroundColor: flag.enabled
                                      ? "green"
                                      : "red",
                                  }}
                                />

                                <h4 className="text-base font-semibold text-default-900 truncate">
                                  {flag.name}
                                </h4>
                                <Chip
                                  variant="bordered"
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
                              {/* Bottoni modifica ed elimina in alto a destra */}

                              <div className="flex items-center gap-1">
                                <Button
                                  isIconOnly
                                  variant="light"
                                  color="primary"
                                  onPress={() => openEditPage(flag)}
                                >
                                  <Icon icon="lucide:edit-3" width={16} />
                                </Button>
                                <Button
                                  isIconOnly
                                  variant="light"
                                  color="danger"
                                  onPress={() =>
                                    deleteFlag(flag.feature_flag_id)
                                  }
                                >
                                  <Icon icon="lucide:trash-2" width={16} />
                                </Button>
                                <Popover showArrow>
                                  <PopoverTrigger>
                                    <Button
                                      isIconOnly
                                      variant="light"
                                      color="primary"
                                    >
                                      <Icon icon="uil:exchange" width={16} />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent>
                                    <Select
                                      className="w-72"
                                      label="Gruppo"
                                      placeholder="Seleziona un gruppo"
                                      selectedKeys={[flag.group_id || "null"]}
                                      onSelectionChange={(keys) => {
                                        const selectedGroupId = Array.from(
                                          keys
                                        )[0] as string;
                                        moveFlagToGroup(
                                          flag.feature_flag_id,
                                          selectedGroupId
                                        );
                                      }}
                                      variant="underlined"
                                    >
                                      <>
                                        <SelectItem key="null">
                                          Nessun gruppo
                                        </SelectItem>
                                        {featureFlagsGroups.map((group) => (
                                          <SelectItem key={group.id}>
                                            {group.name}
                                          </SelectItem>
                                        ))}
                                      </>
                                    </Select>
                                  </PopoverContent>
                                </Popover>
                              </div>

                              <Switch
                                color="success"
                                isSelected={flag.enabled}
                                onValueChange={() => {
                                  toggleFlag(flag.feature_flag_id);
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
                                        key={target.target_id}
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
                                          color="success"
                                          isSelected={target.enabled}
                                          isDisabled={!flag.enabled}
                                          onValueChange={() => {
                                            toggleTarget(
                                              target.target_id,
                                              !target.enabled
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
                      onClick={() => addFlagToGroup(String(group.id))}
                      variant="solid"
                      color="primary"
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
      </div>
    </div>
  );
}
