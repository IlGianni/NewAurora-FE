import { useState, useEffect, useCallback, useRef } from "react";
import {
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Select,
  SelectItem,
  Tooltip,
  Skeleton,
  addToast,
  Card,
  CardBody,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Textarea,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import type { VaultEntry, VaultValueType } from "../../../types";
import GitHubSecretSyncPanel from "../../GitHubSecretSyncPanel";

interface VaultViewProps {
  projectId: number;
}

// Tipo per l'ordinamento
type SortField = "key" | "created_at" | "updated_at";
type SortDirection = "asc" | "desc";

export default function VaultView({ projectId }: VaultViewProps) {
  // Stati principali
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [visibleValues, setVisibleValues] = useState<Set<number>>(new Set());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDropdownOpen, setDeleteDropdownOpen] = useState<number | null>(
    null
  );
  const [editKey, setEditKey] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editType, setEditType] = useState<VaultValueType>("normal");

  // Stati per filtri e ricerca
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<VaultValueType | "all">("all");
  const [sortField, setSortField] = useState<SortField>("key");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Stati per paginazione
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // Stati per modal
  const {
    isOpen: isAddModalOpen,
    onOpen: onAddModalOpen,
    onClose: onAddModalClose,
  } = useDisclosure();
  const {
    isOpen: isEditModalOpen,
    onOpen: onEditModalOpen,
    onClose: onEditModalClose,
  } = useDisclosure();
  const {
    isOpen: isHistoryModalOpen,
    onOpen: onHistoryModalOpen,
    onClose: onHistoryModalClose,
  } = useDisclosure();
  const {
    isOpen: isExportModalOpen,
    onOpen: onExportModalOpen,
    onClose: onExportModalClose,
  } = useDisclosure();
  const {
    isOpen: isGitHubModalOpen,
    onOpen: onGitHubModalOpen,
    onClose: onGitHubModalClose,
  } = useDisclosure();

  // Stati per form
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState<VaultValueType>("normal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [selectedEntryForHistory, setSelectedEntryForHistory] =
    useState<VaultEntry | null>(null);
  const [exportType, setExportType] = useState<
    "docker" | "kubernetes" | "cicd" | "json" | null
  >(null);
  const [exportPreview, setExportPreview] = useState<string>("");

  // Ref per input di ricerca (per shortcut)
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Carica le entry del vault
  const fetchVaultEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/Project/GET/${projectId}/vault`);
      if (response.status === 200) {
        setVaultEntries(response.data.vault_entries || response.data || []);
      }
    } catch (error: any) {
      console.error("Errore nel caricamento del vault:", error);
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: "Impossibile caricare le entry del vault",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Carica la cronologia di una entry
  const fetchHistory = async (vaultId: number) => {
    try {
      const response = await axios.get(
        `/Project/GET/${projectId}/vault/${vaultId}/history`
      );
      if (response.status === 200) {
        setHistoryEntries(response.data.history || response.data || []);
      }
    } catch (error: any) {
      console.error("Errore nel caricamento della cronologia:", error);
      // Se l'endpoint non esiste, mostra messaggio informativo
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Info",
        description: "Cronologia non disponibile",
        color: "default",
      });
    }
  };

  useEffect(() => {
    fetchVaultEntries();
  }, [fetchVaultEntries]);

  // Controlla se deve aprire il modal GitHub dopo login OAuth
  useEffect(() => {
    const shouldOpenModal = sessionStorage.getItem("github_open_modal");
    if (shouldOpenModal === "true") {
      // Rimuovi il flag
      sessionStorage.removeItem("github_open_modal");
      // Apri il modal dopo un breve delay per assicurarsi che il componente sia montato
      setTimeout(() => {
        onGitHubModalOpen();
      }, 500);
    }
  }, [onGitHubModalOpen]);

  // Gestione shortcut da tastiera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K per focus su ricerca
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // Ctrl/Cmd + N per nuova entry
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        onAddModalOpen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onAddModalOpen]);

  // Toggle visibilità valore sensibile
  const toggleValueVisibility = (vaultId: number) => {
    setVisibleValues((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vaultId)) {
        newSet.delete(vaultId);
      } else {
        newSet.add(vaultId);
      }
      return newSet;
    });
  };

  // Copia al clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({
        timeout: 2000,
        shouldShowTimeoutProgress: true,
        title: "Copiato!",
        description: `${label} copiato negli appunti`,
        color: "success",
      });
    } catch (error) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: "Impossibile copiare negli appunti",
        color: "danger",
      });
    }
  };

  // Aggiungi nuova entry
  const handleAddEntry = async () => {
    // Validazione
    if (!newKey.trim()) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: "La chiave è obbligatoria",
        color: "danger",
      });
      return;
    }

    // Verifica key unica
    if (vaultEntries.some((entry) => entry.key === newKey.trim())) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: "Questa chiave esiste già",
        color: "danger",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(`/Project/POST/${projectId}/vault`, {
        key: newKey.trim(),
        value: newValue,
        is_sensitive: newType === "sensitive",
      });

      if (response.status === 200 || response.status === 201) {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Successo",
          description: "Entry aggiunta con successo",
          color: "success",
        });
        onAddModalClose();
        setNewKey("");
        setNewValue("");
        setNewType("normal");
        fetchVaultEntries();
      }
    } catch (error: any) {
      console.error("Errore nell'aggiunta dell'entry:", error);
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description:
          error.response?.data?.message || "Impossibile aggiungere l'entry",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Apri modal modifica
  const handleEditClick = (entry: VaultEntry) => {
    setEditingId(entry.vault_id);
    setEditKey(entry.key);
    setEditValue(entry.value);
    setEditType(entry.is_sensitive ? "sensitive" : "normal");
    onEditModalOpen();
  };

  // Verifica se ci sono modifiche rispetto all'entry originale
  const hasChanges = (): boolean => {
    if (!editingId) return false;
    const originalEntry = vaultEntries.find((e) => e.vault_id === editingId);
    if (!originalEntry) return false;

    const keyChanged = editKey.trim() !== originalEntry.key;
    const valueChanged = editValue !== originalEntry.value;
    const typeChanged =
      editType === "sensitive"
        ? !originalEntry.is_sensitive
        : originalEntry.is_sensitive;

    return keyChanged || valueChanged || typeChanged;
  };

  // Salva modifica
  const handleUpdateEntry = async () => {
    if (!editingId) return;

    if (!editKey.trim()) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: "La chiave è obbligatoria",
        color: "danger",
      });
      return;
    }

    // Verifica key unica (escludendo l'entry corrente)
    if (
      vaultEntries.some(
        (entry) => entry.key === editKey.trim() && entry.vault_id !== editingId
      )
    ) {
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: "Questa chiave esiste già",
        color: "danger",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setIsUpdating(editingId);
      const response = await axios.put(
        `/Project/UPDATE/${projectId}/vault/${editingId}`,
        {
          key: editKey.trim(),
          value: editValue,
          is_sensitive: editType === "sensitive",
        }
      );

      if (response.status === 200) {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Successo",
          description: "Entry aggiornata con successo",
          color: "success",
        });
        onEditModalClose();
        setEditingId(null);
        setVisibleValues((prev) => {
          const newSet = new Set(prev);
          newSet.delete(editingId);
          return newSet;
        });
        fetchVaultEntries();
      }
    } catch (error: any) {
      console.error("Errore nell'aggiornamento dell'entry:", error);
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description:
          error.response?.data?.message || "Impossibile aggiornare l'entry",
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
      setIsUpdating(null);
    }
  };

  // Elimina entry
  const handleDeleteEntry = async (vaultId: number) => {
    try {
      setIsDeleting(vaultId);
      const response = await axios.delete(
        `/Project/DELETE/${projectId}/vault/${vaultId}`
      );

      if (response.status === 200 || response.status === 204) {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Successo",
          description: "Entry eliminata con successo",
          color: "success",
        });
        setVisibleValues((prev) => {
          const newSet = new Set(prev);
          newSet.delete(vaultId);
          return newSet;
        });
        fetchVaultEntries();
      }
    } catch (error: any) {
      console.error("Errore nell'eliminazione dell'entry:", error);
      addToast({
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        title: "Errore",
        description: "Impossibile eliminare l'entry",
        color: "danger",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  // Apri modal cronologia
  const handleHistoryClick = async (entry: VaultEntry) => {
    setSelectedEntryForHistory(entry);
    await fetchHistory(entry.vault_id);
    onHistoryModalOpen();
  };

  // Filtra e ordina le entry
  const filteredAndSortedEntries = vaultEntries
    .filter((entry) => {
      // Filtro per ricerca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !entry.key.toLowerCase().includes(searchLower) &&
          !entry.value.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Filtro per tipo
      if (filterType !== "all") {
        const isSensitive = entry.is_sensitive;
        if (filterType === "sensitive" && !isSensitive) return false;
        if (filterType === "normal" && isSensitive) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "key":
          comparison = a.key.localeCompare(b.key);
          break;
        case "created_at":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "updated_at":
          comparison =
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

  // Calcola paginazione
  const pages = Math.ceil(filteredAndSortedEntries.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedEntries = filteredAndSortedEntries.slice(startIndex, endIndex);

  // Reset pagina quando cambiano i filtri
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterType, sortField, sortDirection]);

  // Export JSON
  const handleExport = () => {
    const data = vaultEntries.map((entry) => ({
      key: entry.key,
      value: entry.value,
      is_sensitive: entry.is_sensitive,
    }));

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vault-export-${projectId}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast({
      timeout: 2000,
      shouldShowTimeoutProgress: true,
      title: "Esportazione completata",
      description: "File JSON scaricato",
      color: "success",
    });
  };

  // Genera export per servizi esterni
  const generateExportContent = (
    type: "docker" | "kubernetes" | "cicd"
  ): string => {
    const entries =
      filteredAndSortedEntries.length > 0
        ? filteredAndSortedEntries
        : vaultEntries;

    switch (type) {
      case "docker":
        // Formato .env per Docker
        return entries
          .map((entry) => {
            // Escape caratteri speciali per .env
            const escapedValue = entry.value
              .replace(/\\/g, "\\\\")
              .replace(/"/g, '\\"')
              .replace(/\$/g, "\\$");
            return `${entry.key}=${escapedValue}`;
          })
          .join("\n");

      case "kubernetes":
        // Formato Secret YAML per Kubernetes
        const k8sEntries = entries.map((entry) => {
          // Base64 encode per Kubernetes Secret
          const base64Value = btoa(entry.value);
          return `  ${entry.key}: ${base64Value}`;
        });
        return `apiVersion: v1
kind: Secret
metadata:
  name: vault-secret
  namespace: default
type: Opaque
data:
${k8sEntries.join("\n")}`;

      case "cicd":
        // Formato variabili d'ambiente per CI/CD (GitHub Actions, GitLab CI, etc.)
        return entries
          .map((entry) => {
            const escapedValue = entry.value
              .replace(/\\/g, "\\\\")
              .replace(/"/g, '\\"')
              .replace(/\$/g, "\\$");
            return `  ${entry.key}: "${escapedValue}"`;
          })
          .join("\n");

      default:
        return "";
    }
  };

  // Gestisce export verso servizi esterni con preview
  const handleExportToService = (type: "docker" | "kubernetes" | "cicd") => {
    const content = generateExportContent(type);
    setExportType(type);
    setExportPreview(content);
    onExportModalOpen();
  };

  // Download del file export
  const downloadExport = () => {
    if (!exportType || !exportPreview) return;

    let filename = "";
    let mimeType = "";

    switch (exportType) {
      case "docker":
        filename = `.env`;
        mimeType = "text/plain";
        break;
      case "kubernetes":
        filename = `vault-secret.yaml`;
        mimeType = "application/x-yaml";
        break;
      case "cicd":
        filename = `vault-variables.yaml`;
        mimeType = "application/x-yaml";
        break;
    }

    const blob = new Blob([exportPreview], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vault-export-${projectId}-${new Date().toISOString()}${filename}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast({
      timeout: 2000,
      shouldShowTimeoutProgress: true,
      title: "Esportazione completata",
      description: `File ${exportType} scaricato`,
      color: "success",
    });

    onExportModalClose();
  };

  // Copia singola key in formato pronto all'uso
  const copyKeyAsFormat = (
    entry: VaultEntry,
    format: "docker" | "kubernetes" | "cicd"
  ) => {
    let content = "";
    switch (format) {
      case "docker":
        const escapedValue = entry.value
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\$/g, "\\$");
        content = `${entry.key}=${escapedValue}`;
        break;
      case "kubernetes":
        const base64Value = btoa(entry.value);
        content = `  ${entry.key}: ${base64Value}`;
        break;
      case "cicd":
        const cicdEscaped = entry.value
          .replace(/\\/g, "\\\\")
          .replace(/"/g, '\\"')
          .replace(/\$/g, "\\$");
        content = `  ${entry.key}: "${cicdEscaped}"`;
        break;
    }
    copyToClipboard(content, `Chiave ${entry.key} (${format})`);
  };

  // Import JSON
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!Array.isArray(data)) {
          throw new Error("Il file JSON deve contenere un array");
        }

        // Validazione e import
        let imported = 0;
        let errors = 0;

        for (const item of data) {
          if (!item.key) {
            errors++;
            continue;
          }

          try {
            // Verifica se esiste già
            const exists = vaultEntries.some((entry) => entry.key === item.key);

            if (exists) {
              // Aggiorna se esiste
              const existing = vaultEntries.find(
                (entry) => entry.key === item.key
              );
              if (existing) {
                await axios.put(
                  `/Project/UPDATE/${projectId}/vault/${existing.vault_id}`,
                  {
                    key: item.key,
                    value: item.value || "",
                    is_sensitive: item.is_sensitive || false,
                  }
                );
                imported++;
              }
            } else {
              // Crea nuova entry
              await axios.post(`/Project/POST/${projectId}/vault`, {
                key: item.key,
                value: item.value || "",
                is_sensitive: item.is_sensitive || false,
              });
              imported++;
            }
          } catch (error) {
            errors++;
          }
        }

        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Import completato",
          description: `${imported} entry importate${
            errors > 0 ? `, ${errors} errori` : ""
          }`,
          color: errors > 0 ? "warning" : "success",
        });

        fetchVaultEntries();
      } catch (error) {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore",
          description: "Impossibile importare il file JSON",
          color: "danger",
        });
      }
    };

    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Header con azioni */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Vault del Progetto</h2>
          <p className="text-sm text-default-500 mt-1">
            Gestisci le key-value del progetto
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Tooltip content="Importa da JSON (Ctrl/Cmd + I)">
            <Button
              variant="flat"
              startContent={<Icon icon="solar:import-linear" />}
              onPress={handleImport}
            >
              Importa
            </Button>
          </Tooltip>
          <Dropdown>
            <DropdownTrigger>
              <Button
                variant="flat"
                endContent={<Icon icon="solar:alt-arrow-down-linear" />}
                startContent={<Icon icon="solar:export-linear" />}
              >
                Esporta
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Export options"
              onAction={(key) => {
                if (key === "json") {
                  handleExport();
                } else {
                  handleExportToService(
                    key as "docker" | "kubernetes" | "cicd"
                  );
                }
              }}
            >
              <DropdownItem
                key="json"
                startContent={<Icon icon="solar:file-text-linear" />}
              >
                JSON
              </DropdownItem>
              <DropdownItem
                key="docker"
                startContent={<Icon icon="solar:code-square-linear" />}
              >
                Docker .env
              </DropdownItem>
              <DropdownItem
                key="kubernetes"
                startContent={<Icon icon="solar:code-square-linear" />}
              >
                Kubernetes YAML
              </DropdownItem>
              <DropdownItem
                key="cicd"
                startContent={<Icon icon="solar:code-square-linear" />}
              >
                CI/CD YAML
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Tooltip content="Aggiungi nuova entry (Ctrl/Cmd + N)">
            <Button
              color="primary"
              startContent={<Icon icon="solar:add-circle-linear" />}
              onPress={onAddModalOpen}
            >
              Nuova Entry
            </Button>
          </Tooltip>
          <Tooltip content="Sincronizza secret con GitHub Actions">
            <Button
              color="default"
              variant="bordered"
              startContent={<Icon icon="mdi:github" />}
              onPress={onGitHubModalOpen}
            >
              GitHub Actions
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Filtri e ricerca */}
      <Card>
        <CardBody className="gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Ricerca */}
            <Input
              ref={searchInputRef}
              placeholder="Cerca per chiave o valore..."
              startContent={<Icon icon="solar:magnifer-linear" />}
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="flex-1"
              endContent={
                searchTerm && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setSearchTerm("")}
                  >
                    <Icon icon="solar:close-circle-linear" />
                  </Button>
                )
              }
            />

            {/* Filtro tipo */}
            <Select
              placeholder="Filtra per tipo"
              selectedKeys={[filterType]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFilterType(selected as VaultValueType | "all");
              }}
              className="w-full sm:w-48"
            >
              <SelectItem key="all">Tutti</SelectItem>
              <SelectItem key="sensitive">Sensibili</SelectItem>
              <SelectItem key="normal">Normali</SelectItem>
            </Select>

            {/* Ordinamento */}
            <Select
              placeholder="Ordina per"
              selectedKeys={[`${sortField}-${sortDirection}`]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                const [field, direction] = selected.split("-");
                setSortField(field as SortField);
                setSortDirection(direction as SortDirection);
              }}
              className="w-full sm:w-48"
            >
              <SelectItem key="key-asc">Chiave (A-Z)</SelectItem>
              <SelectItem key="key-desc">Chiave (Z-A)</SelectItem>
              <SelectItem key="created_at-desc">
                Data creazione (recente)
              </SelectItem>
              <SelectItem key="created_at-asc">
                Data creazione (vecchia)
              </SelectItem>
              <SelectItem key="updated_at-desc">
                Ultima modifica (recente)
              </SelectItem>
              <SelectItem key="updated_at-asc">
                Ultima modifica (vecchia)
              </SelectItem>
            </Select>
          </div>

          {/* Tooltip con info */}
          <div className="flex items-center gap-2 text-xs text-default-500">
            <Icon icon="solar:info-circle-linear" className="text-sm" />
            <span>
              Shortcut:{" "}
              <kbd className="px-1 py-0.5 bg-default-100 rounded">
                Ctrl/Cmd + K
              </kbd>{" "}
              per cercare,{" "}
              <kbd className="px-1 py-0.5 bg-default-100 rounded">
                Ctrl/Cmd + N
              </kbd>{" "}
              per nuova entry
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Tabella */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredAndSortedEntries.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Icon
              icon="solar:lock-password-linear"
              className="text-6xl text-default-300 mx-auto mb-4"
            />
            <p className="text-default-500">
              {vaultEntries.length === 0
                ? "Nessuna entry nel vault. Aggiungine una per iniziare."
                : "Nessuna entry corrisponde ai filtri selezionati."}
            </p>
          </CardBody>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardBody className="p-0">
            <Table
              aria-label="Tabella Vault"
              removeWrapper
              classNames={{
                wrapper: "min-h-[400px]",
                th: "bg-default-50 text-default-700 font-semibold text-sm uppercase",
                td: "py-4",
                tr: "hover:bg-default-50/50 transition-colors",
              }}
            >
              <TableHeader>
                <TableColumn width="25%">CHIAVE</TableColumn>
                <TableColumn width="35%">VALORE</TableColumn>
                <TableColumn width="15%">TIPO</TableColumn>
                <TableColumn width="25%" className="text-center">
                  AZIONI
                </TableColumn>
              </TableHeader>
              <TableBody
                emptyContent="Nessuna entry trovata"
                isLoading={isLoading}
                loadingContent={<Spinner label="Caricamento..." />}
              >
                {paginatedEntries.map((entry) => {
                  const isVisible = visibleValues.has(entry.vault_id);
                  const displayValue = entry.is_sensitive
                    ? isVisible
                      ? entry.value
                      : "******"
                    : entry.value;
                  const isEntryDeleting = isDeleting === entry.vault_id;
                  const isEntryUpdating = isUpdating === entry.vault_id;

                  return (
                    <TableRow
                      key={entry.vault_id}
                      className={
                        entry.is_sensitive
                          ? "border-l-4 border-l-danger bg-danger-50/30"
                          : ""
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-default-100 dark:bg-default-200 px-3 py-1.5 rounded-lg border border-default-200 font-semibold">
                            {entry.key}
                          </code>
                          <Tooltip content="Copia chiave">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="min-w-8 h-8"
                              onPress={() =>
                                copyToClipboard(entry.key, "Chiave")
                              }
                            >
                              <Icon
                                icon="solar:copy-linear"
                                className="text-base"
                              />
                            </Button>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1 min-w-0 max-w-full">
                            <div
                              className="overflow-x-auto w-full"
                              style={{ maxWidth: "100%" }}
                            >
                              <code className="text-sm font-mono bg-default-50 dark:bg-default-100 px-3 py-2 rounded-lg border border-default-200 whitespace-nowrap inline-block min-w-full">
                                {displayValue}
                              </code>
                            </div>
                          </div>
                          {entry.is_sensitive && (
                            <Tooltip
                              content={
                                isVisible ? "Nascondi valore" : "Mostra valore"
                              }
                            >
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="danger"
                                className="min-w-8 h-8"
                                onPress={() =>
                                  toggleValueVisibility(entry.vault_id)
                                }
                              >
                                <Icon
                                  icon={
                                    isVisible
                                      ? "solar:eye-closed-linear"
                                      : "solar:eye-linear"
                                  }
                                  className="text-base"
                                />
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip content="Copia valore">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              className="min-w-8 h-8"
                              onPress={() =>
                                copyToClipboard(entry.value, "Valore")
                              }
                            >
                              <Icon
                                icon="solar:copy-linear"
                                className="text-base"
                              />
                            </Button>
                          </Tooltip>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="min-w-8 h-8"
                              >
                                <Icon
                                  icon="solar:code-square-linear"
                                  className="text-base"
                                />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label="Copy as format"
                              onAction={(key) =>
                                copyKeyAsFormat(
                                  entry,
                                  key as "docker" | "kubernetes" | "cicd"
                                )
                              }
                            >
                              <DropdownItem
                                key="docker"
                                startContent={
                                  <Icon icon="solar:code-square-linear" />
                                }
                              >
                                Copia come Docker .env
                              </DropdownItem>
                              <DropdownItem
                                key="kubernetes"
                                startContent={
                                  <Icon icon="solar:code-square-linear" />
                                }
                              >
                                Copia come Kubernetes
                              </DropdownItem>
                              <DropdownItem
                                key="cicd"
                                startContent={
                                  <Icon icon="solar:code-square-linear" />
                                }
                              >
                                Copia come CI/CD
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.is_sensitive && (
                            <Icon
                              icon="solar:danger-triangle-linear"
                              className="text-danger text-lg"
                            />
                          )}
                          <Chip
                            color={entry.is_sensitive ? "danger" : "default"}
                            variant={entry.is_sensitive ? "solid" : "flat"}
                            size="sm"
                          >
                            {entry.is_sensitive ? "Sensibile" : "Normale"}
                          </Chip>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {(isEntryDeleting || isEntryUpdating) && (
                            <Spinner size="sm" color="primary" />
                          )}
                          <Tooltip content="Modifica">
                            <Button
                              isIconOnly
                              size="md"
                              variant="light"
                              color="primary"
                              className="min-w-10 h-10"
                              onPress={() => handleEditClick(entry)}
                              isDisabled={isEntryDeleting || isEntryUpdating}
                            >
                              <Icon
                                icon="solar:pen-linear"
                                className="text-lg"
                              />
                            </Button>
                          </Tooltip>
                          <Tooltip content="Cronologia">
                            <Button
                              isIconOnly
                              size="md"
                              variant="light"
                              color="default"
                              className="min-w-10 h-10"
                              onPress={() => handleHistoryClick(entry)}
                              isDisabled={isEntryDeleting || isEntryUpdating}
                            >
                              <Icon
                                icon="solar:history-linear"
                                className="text-lg"
                              />
                            </Button>
                          </Tooltip>
                          <Dropdown
                            placement="bottom"
                            isDisabled={isEntryDeleting || isEntryUpdating}
                            isOpen={deleteDropdownOpen === entry.vault_id}
                            onOpenChange={(open) => {
                              setDeleteDropdownOpen(
                                open ? entry.vault_id : null
                              );
                            }}
                            classNames={{
                              base: "min-w-[200px]",
                            }}
                          >
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                size="md"
                                variant="light"
                                color="danger"
                                className="min-w-10 h-10"
                                isLoading={isEntryDeleting}
                              >
                                {!isEntryDeleting && (
                                  <Icon
                                    icon="solar:trash-bin-trash-linear"
                                    className="text-lg"
                                  />
                                )}
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label="Conferma eliminazione"
                              onAction={(actionKey) => {
                                if (actionKey === "confirm") {
                                  handleDeleteEntry(entry.vault_id);
                                }
                              }}
                              classNames={{
                                base: "min-w-[200px]",
                              }}
                            >
                              <DropdownItem
                                key="info"
                                isReadOnly
                                textValue="Sei sicuro"
                                className="h-auto py-1.5 cursor-default pointer-events-none"
                                classNames={{
                                  base: "hover:bg-transparent focus:bg-transparent data-[hover=true]:bg-transparent",
                                }}
                              >
                                <div className="flex flex-col gap-0.5">
                                  <p className="text-xs font-medium text-foreground">
                                    Sei sicuro?
                                  </p>
                                  <p className="text-xs text-default-500">
                                    Questa azione non può essere annullata
                                  </p>
                                </div>
                              </DropdownItem>
                              <DropdownItem
                                key="actions"
                                isReadOnly
                                textValue="Actions"
                                className="h-auto py-2 cursor-default"
                                classNames={{
                                  base: "hover:bg-transparent focus:bg-transparent data-[hover=true]:bg-transparent",
                                }}
                              >
                                <div
                                  className="flex items-center justify-between gap-2 w-full"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    size="sm"
                                    variant="light"
                                    className="flex-1"
                                    startContent={
                                      <Icon icon="solar:close-circle-linear" />
                                    }
                                    onPress={() => {
                                      setDeleteDropdownOpen(null);
                                    }}
                                  >
                                    Annulla
                                  </Button>
                                  <Button
                                    size="sm"
                                    color="danger"
                                    className="flex-1"
                                    startContent={
                                      <Icon icon="solar:trash-bin-trash-linear" />
                                    }
                                    onPress={() => {
                                      setDeleteDropdownOpen(null);
                                      handleDeleteEntry(entry.vault_id);
                                    }}
                                  >
                                    Conferma
                                  </Button>
                                </div>
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-default-200">
                <div className="text-sm text-default-500">
                  Mostrando {startIndex + 1} -{" "}
                  {Math.min(endIndex, filteredAndSortedEntries.length)} di{" "}
                  {filteredAndSortedEntries.length} entry
                </div>
                <Pagination
                  total={pages}
                  page={page}
                  onChange={setPage}
                  color="primary"
                  size="sm"
                  showControls
                  showShadow
                />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Modal Aggiungi Entry */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={onAddModalClose}
        size="2xl"
        backdrop="blur"
      >
        <ModalContent
          className={
            newType === "sensitive" ? "border-l-4 border-l-danger" : ""
          }
        >
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {newType === "sensitive" && (
                <Icon
                  icon="solar:danger-triangle-linear"
                  className="text-danger text-xl"
                />
              )}
              <span>Aggiungi Nuova Entry</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {newType === "sensitive" && (
              <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-3 mb-4 flex items-start gap-2">
                <Icon
                  icon="solar:danger-triangle-linear"
                  className="text-danger text-lg mt-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-danger mb-1">
                    Valore Sensibile
                  </p>
                  <p className="text-xs text-danger-700 dark:text-danger-300">
                    Questo valore verrà oscurato di default e sarà visibile solo
                    dopo aver cliccato sull'icona dell'occhio.
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <Input
                label="Chiave"
                placeholder="es. API_KEY, DATABASE_URL"
                value={newKey}
                onValueChange={setNewKey}
                isRequired
                description="La chiave deve essere unica per questo progetto"
                startContent={<Icon icon="solar:key-linear" />}
              />
              <Input
                label="Valore"
                placeholder="Inserisci il valore"
                value={newValue}
                onValueChange={setNewValue}
                description="I valori sensibili verranno oscurati di default"
              />
              <Select
                label="Tipo"
                selectedKeys={[newType]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setNewType(selected as VaultValueType);
                }}
                description="I valori sensibili sono oscurati finché non cliccati"
                classNames={{
                  trigger: newType === "sensitive" ? "border-danger" : "",
                }}
              >
                <SelectItem key="normal">Normale</SelectItem>
                <SelectItem key="sensitive">Sensibile</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAddModalClose}>
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleAddEntry}
              isLoading={isSubmitting}
            >
              Salva
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Modifica Entry */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={onEditModalClose}
        size="2xl"
        backdrop="blur"
      >
        <ModalContent
          className={
            editType === "sensitive" ? "border-l-4 border-l-danger" : ""
          }
        >
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {editType === "sensitive" && (
                <Icon
                  icon="solar:danger-triangle-linear"
                  className="text-danger text-xl"
                />
              )}
              <span>Modifica Entry</span>
            </div>
          </ModalHeader>
          <ModalBody>
            {editType === "sensitive" && (
              <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-3 mb-4 flex items-start gap-2">
                <Icon
                  icon="solar:danger-triangle-linear"
                  className="text-danger text-lg mt-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-danger mb-1">
                    Valore Sensibile
                  </p>
                  <p className="text-xs text-danger-700 dark:text-danger-300">
                    Questo valore verrà oscurato di default e sarà visibile solo
                    dopo aver cliccato sull'icona dell'occhio.
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-4">
              <Input
                label="Chiave"
                placeholder="es. API_KEY, DATABASE_URL"
                value={editKey}
                onValueChange={setEditKey}
                isRequired
                description="La chiave deve essere unica per questo progetto"
                startContent={<Icon icon="solar:key-linear" />}
              />
              <Input
                label="Valore"
                placeholder="Inserisci il valore"
                value={editValue}
                onValueChange={setEditValue}
                description="I valori sensibili verranno oscurati di default"
              />
              <Select
                label="Tipo"
                selectedKeys={[editType]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setEditType(selected as VaultValueType);
                }}
                description="I valori sensibili sono oscurati finché non cliccati"
                classNames={{
                  trigger: editType === "sensitive" ? "border-danger" : "",
                }}
              >
                <SelectItem key="normal">Normale</SelectItem>
                <SelectItem key="sensitive">Sensibile</SelectItem>
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditModalClose}>
              Annulla
            </Button>
            <Button
              color="primary"
              onPress={handleUpdateEntry}
              isLoading={isSubmitting}
              isDisabled={!hasChanges() || !editKey.trim()}
            >
              Salva Modifiche
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Cronologia */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={onHistoryModalClose}
        size="3xl"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon icon="solar:history-linear" className="text-lg" />
              <span>Cronologia Modifiche</span>
            </div>
            {selectedEntryForHistory && (
              <div className="flex items-center gap-2 mt-2">
                <code className="text-sm font-mono bg-default-100 dark:bg-default-200 text-foreground px-2 py-1 rounded">
                  {selectedEntryForHistory.key}
                </code>
                <Chip
                  size="sm"
                  color={
                    selectedEntryForHistory.is_sensitive ? "danger" : "default"
                  }
                  variant={
                    selectedEntryForHistory.is_sensitive ? "solid" : "flat"
                  }
                >
                  {selectedEntryForHistory.is_sensitive
                    ? "Sensibile"
                    : "Normale"}
                </Chip>
              </div>
            )}
          </ModalHeader>
          <ModalBody>
            {historyEntries.length === 0 ? (
              <div className="text-center py-8 text-default-500">
                <Icon
                  icon="solar:history-linear"
                  className="text-4xl mx-auto mb-4 text-default-300"
                />
                <p>Nessuna cronologia disponibile per questa entry</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historyEntries.map((history, index) => (
                  <Card
                    key={index}
                    className="bg-default-50 dark:bg-default-100 border border-default-200 dark:border-default-300"
                  >
                    <CardBody>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {history.is_sensitive && (
                              <Icon
                                icon="solar:danger-triangle-linear"
                                className="text-danger text-lg"
                              />
                            )}
                            <Chip
                              size="sm"
                              color={
                                history.is_sensitive ? "danger" : "default"
                              }
                              variant={history.is_sensitive ? "solid" : "flat"}
                            >
                              {history.is_sensitive ? "Sensibile" : "Normale"}
                            </Chip>
                          </div>
                          <div className="bg-white dark:bg-default-200 border border-default-200 dark:border-default-300 rounded-lg p-3 mb-2">
                            <p className="text-sm text-foreground dark:text-foreground break-all font-mono">
                              {history.is_sensitive ? "******" : history.value}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon
                              icon="solar:calendar-linear"
                              className="text-default-500 dark:text-default-400 text-sm"
                            />
                            <p className="text-xs text-default-600 dark:text-default-400">
                              {new Date(history.changed_at).toLocaleString(
                                "it-IT",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onHistoryModalClose}>
              Chiudi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal Preview Export */}
      <Modal
        isOpen={isExportModalOpen}
        onClose={onExportModalClose}
        size="4xl"
        backdrop="blur"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:code-square-linear"
                className="text-primary text-xl"
              />
              <span>
                Preview Export -{" "}
                {exportType === "docker"
                  ? "Docker .env"
                  : exportType === "kubernetes"
                  ? "Kubernetes YAML"
                  : exportType === "cicd"
                  ? "CI/CD YAML"
                  : ""}
              </span>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-default-500">
                  Anteprima del file che verrà scaricato
                </p>
                <Tooltip content="Copia tutto il contenuto">
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<Icon icon="solar:copy-linear" />}
                    onPress={() =>
                      copyToClipboard(exportPreview, "Export completo")
                    }
                  >
                    Copia
                  </Button>
                </Tooltip>
              </div>
              <div className="relative">
                <Textarea
                  value={exportPreview}
                  readOnly
                  minRows={15}
                  maxRows={25}
                  classNames={{
                    input: "font-mono text-sm",
                    inputWrapper: "bg-default-50",
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onExportModalClose}>
              Annulla
            </Button>
            <Button
              color="primary"
              startContent={<Icon icon="solar:download-linear" />}
              onPress={downloadExport}
            >
              Scarica File
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal GitHub Actions */}
      <Modal
        isOpen={isGitHubModalOpen}
        onClose={onGitHubModalClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Icon icon="mdi:github" className="text-xl" />
              <span>Sincronizza Secret con GitHub Actions</span>
            </div>
          </ModalHeader>
          <ModalBody>
            <GitHubSecretSyncPanel
              secretsList={vaultEntries.map((entry) => ({
                keyName: entry.key,
                value: entry.value,
                isSensitive: entry.is_sensitive,
              }))}
              existingTokenStored={false}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onGitHubModalClose}>
              Chiudi
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
