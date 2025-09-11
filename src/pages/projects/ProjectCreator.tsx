import React, { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  DatePicker,
  Textarea,
  Button,
  Select,
  SelectItem,
  Divider,
  Chip,
  Avatar,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { type DateValue } from "@internationalized/date";
import { I18nProvider, useDateFormatter } from "@react-aria/i18n";

interface ProjectFormData {
  name: string;
  description: string;
  startDate: DateValue | null;
  endDate: DateValue | null;
  projectStatus: string;
  teamMembers: string[];
}

interface FormErrors {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  projectStatus?: string;
  teamMembers?: string;
}

interface ProjectStatus {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function ProjectCreator() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Formatter per le date
  const dateFormatter = useDateFormatter({ dateStyle: "full" });
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    description: "",
    startDate: null,
    endDate: null,
    projectStatus: "",
    teamMembers: [],
  });

  // Mock data per gli stati del progetto
  const projectStatuses: ProjectStatus[] = [
    { id: "1", name: "Pianificazione" },
    { id: "2", name: "In Corso" },
    { id: "3", name: "In Revisione" },
    { id: "4", name: "Completato" },
    { id: "5", name: "Sospeso" },
  ];

  // Mock data per i membri del team
  const availableTeamMembers: TeamMember[] = [
    {
      id: "1",
      name: "Andrea Rossi",
      email: "andrea@example.com",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    {
      id: "2",
      name: "Marco Bianchi",
      email: "marco@example.com",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    {
      id: "3",
      name: "Sofia Verdi",
      email: "sofia@example.com",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    {
      id: "4",
      name: "Giulia Neri",
      email: "giulia@example.com",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    {
      id: "5",
      name: "Luca Rossi",
      email: "luca@example.com",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validazione nome
    if (!formData.name.trim()) {
      newErrors.name = "Il nome del progetto è obbligatorio";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Il nome deve essere di almeno 3 caratteri";
    }

    // Validazione descrizione (opzionale)
    if (
      formData.description.trim() &&
      formData.description.trim().length < 10
    ) {
      newErrors.description =
        "La descrizione deve essere di almeno 10 caratteri";
    }

    // Validazione date (opzionali)

    // Validazione che la data di fine sia dopo quella di inizio
    if (formData.startDate && formData.endDate) {
      if (formData.endDate.compare(formData.startDate) <= 0) {
        newErrors.endDate =
          "La data di fine deve essere successiva alla data di inizio";
      }
    }

    // Validazione stato progetto
    if (!formData.projectStatus) {
      newErrors.projectStatus = "Lo stato del progetto è obbligatorio";
    }

    // Validazione membri team (completamente opzionale)
    // I membri del team sono opzionali, nessuna validazione richiesta

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    field: keyof ProjectFormData,
    value: string | DateValue | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Rimuovi errore quando l'utente inizia a digitare
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleTeamMemberToggle = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(memberId)
        ? prev.teamMembers.filter((id) => id !== memberId)
        : [...prev.teamMembers, memberId],
    }));

    // Rimuovi errore team members se presente (non più necessario)
    if (errors.teamMembers) {
      setErrors((prev) => ({
        ...prev,
        teamMembers: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validazione del form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepara i dati per l'API convertendo le date in stringhe
      const apiData = {
        ...formData,
        startDate: formData.startDate ? formData.startDate.toString() : null,
        endDate: formData.endDate ? formData.endDate.toString() : null,
      };

      // Simula chiamata API
      const res = await axios.post("/project/POST/create-project", {
        project_data: apiData,
      });

      if (res.status === 200) {
        navigate("/projects");
      } else {
        throw new Error("Errore durante la creazione del progetto");
      }

      console.log("Dati del progetto:", formData);
    } catch (error) {
      console.error("Errore durante la creazione del progetto:", error);
      // Qui potresti aggiungere un toast di errore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/projects");
  };

  const selectedMembers = availableTeamMembers.filter((member) =>
    formData.teamMembers.includes(member.id)
  );

  // Filtra i membri del team in base al termine di ricerca
  const filteredTeamMembers = availableTeamMembers.filter((member) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.name.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Crea Nuovo Progetto
          </h1>
          <p className="text-sm text-default-500 mt-1">
            Compila i dettagli per creare un nuovo progetto
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informazioni Base */}
        <Card className="shadow-none border border-default-200 rounded-3xl p-3">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:document-text-outline"
                className="text-primary"
              />
              <h2 className="text-lg font-semibold">Informazioni Base</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Nome Progetto"
              placeholder="Inserisci il nome del progetto"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              isRequired
              isInvalid={!!errors.name}
              errorMessage={errors.name}
              startContent={<Icon icon="solar:folder-outline" />}
              variant="bordered"
              className="shadow-none"
            />

            <Textarea
              label="Descrizione"
              placeholder="Descrivi gli obiettivi e i dettagli del progetto"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              isInvalid={!!errors.description}
              errorMessage={errors.description}
              minRows={3}
              variant="bordered"
              className="shadow-none"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <I18nProvider locale="it-IT">
                  <DatePicker
                    label="Data di Inizio"
                    showMonthAndYearPickers
                    value={formData.startDate}
                    onChange={(value) => handleInputChange("startDate", value)}
                    isInvalid={!!errors.startDate}
                    errorMessage={errors.startDate}
                    variant="bordered"
                    className="shadow-none"
                    firstDayOfWeek="mon"
                    pageBehavior="single"
                    visibleMonths={2}
                    color="primary"
                    selectorIcon={<Icon icon="solar:calendar-linear" />}
                  />
                </I18nProvider>
              </div>

              <div className="space-y-2">
                <I18nProvider locale="it-IT">
                  <DatePicker
                    label="Data di Fine"
                    showMonthAndYearPickers
                    value={formData.endDate}
                    onChange={(value) => handleInputChange("endDate", value)}
                    isInvalid={!!errors.endDate}
                    errorMessage={errors.endDate}
                    variant="bordered"
                    className="shadow-none"
                    firstDayOfWeek="mon"
                    pageBehavior="single"
                    visibleMonths={2}
                    color="secondary"
                    selectorIcon={<Icon icon="solar:calendar-linear" />}
                  />
                </I18nProvider>
              </div>
            </div>

            <Select
              label="Stato del Progetto"
              placeholder="Seleziona lo stato iniziale"
              selectedKeys={
                formData.projectStatus ? [formData.projectStatus] : []
              }
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                handleInputChange("projectStatus", selectedKey || "");
              }}
              isRequired
              isInvalid={!!errors.projectStatus}
              errorMessage={errors.projectStatus}
              startContent={<Icon icon="solar:chart-outline" />}
              variant="bordered"
            >
              {projectStatuses.map((status) => (
                <SelectItem key={status.id}>{status.name}</SelectItem>
              ))}
            </Select>
          </CardBody>
        </Card>

        {/* Team Members */}
        <Card className="shadow-none border border-default-200 rounded-3xl p-3">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:users-group-rounded-outline"
                className="text-primary"
              />
              <h2 className="text-lg font-semibold">Membri del Team</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <p className="text-sm text-default-500">
              Seleziona i membri del team che parteciperanno al progetto
              (opzionale)
            </p>

            {/* Campo di ricerca */}
            <Input
              placeholder="Cerca per nome o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<Icon icon="solar:magnifer-outline" />}
              endContent={
                searchTerm && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    onPress={() => setSearchTerm("")}
                  >
                    <Icon icon="solar:close-circle-outline" />
                  </Button>
                )
              }
              variant="bordered"
              className="shadow-none"
            />

            {/* Membri Selezionati */}
            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Membri Selezionati:
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <Chip
                      key={member.id}
                      variant="flat"
                      color="primary"
                      onClose={() => handleTeamMemberToggle(member.id)}
                      startContent={
                        <Avatar
                          src={member.avatar}
                          name={member.name}
                          size="sm"
                          className="w-5 h-5"
                        />
                      }
                    >
                      {member.name}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <Divider />

            {/* Lista Membri Disponibili */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Membri Disponibili:
                </p>
                {searchTerm && (
                  <p className="text-xs text-default-500">
                    {filteredTeamMembers.length} risultato/i trovato/i
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredTeamMembers.length > 0 ? (
                  filteredTeamMembers.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-3xl border cursor-pointer transition-all ${
                        formData.teamMembers.includes(member.id)
                          ? "border-primary bg-primary/5"
                          : "border-default-200 hover:border-primary/50"
                      }`}
                      onClick={() => handleTeamMemberToggle(member.id)}
                    >
                      <Avatar
                        src={member.avatar}
                        name={member.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-default-500 truncate">
                          {member.email}
                        </p>
                      </div>
                      <Icon
                        icon={
                          formData.teamMembers.includes(member.id)
                            ? "solar:check-circle-bold"
                            : "solar:add-circle-outline"
                        }
                        className={`text-sm ${
                          formData.teamMembers.includes(member.id)
                            ? "text-primary"
                            : "text-default-400"
                        }`}
                        width={24}
                        height={24}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
                    <Icon
                      icon="solar:magnifer-outline"
                      className="text-4xl text-default-300 mb-2"
                    />
                    <p className="text-sm text-default-500 mb-1">
                      Nessun membro trovato
                    </p>
                    <p className="text-xs text-default-400">
                      Prova a modificare i termini di ricerca
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Azioni */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
          <div className="flex gap-2" />

          <div className="flex gap-3">
            <Button
              variant="light"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              color="primary"
              isLoading={isSubmitting}
              startContent={!isSubmitting && <Icon icon="mdi:folder-add" />}
            >
              {isSubmitting ? "Creazione..." : "Crea Progetto"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
