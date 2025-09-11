import { Icon } from "@iconify/react";

import { type SidebarItem } from "./Sidebar";

export const sectionItems: SidebarItem[] = [
  {
    key: "overview",
    title: "Overview",
    items: [
      {
        key: "dashboard",
        href: "/",
        icon: "solar:home-2-linear",
        title: "Dashboard",
      },
      {
        key: "projects",
        href: "/projects",
        icon: "solar:widget-2-outline",
        title: "Progetti",
        endContent: (
          <Icon
            className="text-default-400"
            icon="solar:add-circle-line-duotone"
            width={24}
          />
        ),
      },
      {
        key: "team",
        href: "/team",
        icon: "solar:users-group-two-rounded-outline",
        title: "Team",
      },
      {
        key: "calendar",
        href: "/calendar",
        icon: "solar:calendar-outline",
        title: "Calendario",
      },
    ],
  },
  {
    key: "management",
    title: "Gestione",
    items: [
      {
        key: "clients",
        href: "/clients",
        icon: "solar:users-group-rounded-outline",
        title: "Clienti",
      },
      {
        key: "invoices",
        href: "/invoices",
        icon: "solar:bill-list-outline",
        title: "Fatture",
      },
      {
        key: "reports",
        href: "/reports",
        icon: "solar:chart-outline",
        title: "Report",
      },
      {
        key: "settings",
        href: "/settings",
        icon: "solar:settings-outline",
        title: "Impostazioni",
      },
    ],
  },
];
