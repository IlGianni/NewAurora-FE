import { useState } from "react";
import { Icon } from "@iconify/react";
import type { ProjectMethodology } from "../../../types";
import ScrumView from "./ScrumView";
import KanbanView from "./KanbanView";

export default function ProjectDetailTask() {
  const [methodology, setMethodology] = useState<ProjectMethodology>("scrum");
  const projectId = 1; // Questo dovrebbe venire dai props o dal context

  return (
    <div className="space-y-6">
      {/* Selettore Metodologia */}
      <div className="bg-gradient-to-br from-default-50 to-default-100/50 border border-default-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-default-900">
              Metodologia di Lavoro
            </h3>
            <p className="text-xs text-default-500 mt-1">
              Scegli come gestire i task del progetto
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMethodology("scrum")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                methodology === "scrum"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-default-600 border border-default-200 hover:border-default-300"
              }`}
            >
              <Icon icon="solar:rocket-2-linear" className="text-base" />
              Scrum
            </button>
            <button
              onClick={() => setMethodology("kanban")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                methodology === "kanban"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-default-600 border border-default-200 hover:border-default-300"
              }`}
            >
              <Icon icon="solar:clipboard-list-linear" className="text-base" />
              Kanban
            </button>
          </div>
        </div>

        {/* Descrizione metodologia selezionata */}
        <div className="mt-4 p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-default-200/50">
          {methodology === "scrum" ? (
            <div className="flex gap-3">
              <Icon
                icon="solar:rocket-2-bold-duotone"
                className="text-2xl text-primary flex-shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-default-900 mb-1 flex items-center gap-2">
                  Metodologia Scrum
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    Sprint Based
                  </span>
                </h4>
                <p className="text-xs text-default-600 mb-3">
                  Organizza il lavoro in sprint a tempo fisso. Gestisci il
                  backlog, pianifica gli sprint e monitora il progresso del
                  team.
                </p>
                <div className="flex gap-3 text-[11px] text-default-500">
                  <span className="flex items-center gap-1">
                    <Icon
                      icon="solar:checklist-minimalistic-linear"
                      className="text-sm"
                    />
                    Backlog
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon
                      icon="solar:calendar-mark-linear"
                      className="text-sm"
                    />
                    Sprint
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon="solar:chart-linear" className="text-sm" />
                    Story Points
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Icon
                icon="solar:clipboard-list-bold-duotone"
                className="text-2xl text-primary flex-shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-default-900 mb-1 flex items-center gap-2">
                  Metodologia Kanban
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                    Flow Based
                  </span>
                </h4>
                <p className="text-xs text-default-600 mb-3">
                  Visualizza il flusso di lavoro con colonne personalizzabili.
                  Sposta i task con drag & drop e imposta limiti WIP.
                </p>
                <div className="flex gap-3 text-[11px] text-default-500">
                  <span className="flex items-center gap-1">
                    <Icon icon="solar:widget-5-linear" className="text-sm" />
                    Colonne Custom
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon="solar:hand-shake-linear" className="text-sm" />
                    Drag & Drop
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon
                      icon="solar:chart-square-linear"
                      className="text-sm"
                    />
                    WIP Limits
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vista corrispondente */}
      <div className="mt-6">
        {methodology === "scrum" ? (
          <ScrumView projectId={projectId} />
        ) : (
          <KanbanView projectId={projectId} />
        )}
      </div>
    </div>
  );
}
