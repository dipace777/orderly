import * as React from "react";
import { Command } from "lucide-react";

import { NavFavorites } from "@/components/nav-favorites";
import { NavMain } from "@/components/nav-main";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  teams: [
    {
      name: "Smokey Kitchen",
      logo: Command,
      plan: "Enterprise",
    },
  ],
  navMain: [],

  favorites: [
    {
      name: "Dashboard",
      url: "/dashboard",
      emoji: "📊",
    },
    {
      name: "Orders",
      url: "/orders",
      emoji: "📦",
    },
    {
      name: "Food Menu",
      url: "/food-menu",
      emoji: "📋",
    },
    {
      name: "Users",
      url: "users",
      emoji: "👥",
    },
    {
      name: "Reports",
      url: "reports",
      emoji: "📊",
    },
  ],
};

export function SidebarLeft({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={data.favorites} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
