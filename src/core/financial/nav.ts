import {
  Wallet,
  Tag,
  Search,
  Banknote,
  BarChart3,
} from "lucide-react";

import type { NavGroup, NavItem } from "@/common/kernel-contracts";

/**
 * The collapsible "Financial" sidebar section. All financial nav items share
 * this group so the shell clusters them under one expandable parent:
 *
 *   Financial
 *   ├─ Services
 *   ├─ Invoice Search
 *   ├─ Cash Sessions
 *   └─ Reports
 */
const financialGroup: NavGroup = {
  id: "financial",
  labelKey: "financial.nav.group",
  icon: Wallet,
  order: 35,
};

export const financialNav: readonly NavItem[] = [
  {
    id: "financial-services",
    path: "/financial/services",
    labelKey: "financial.nav.services",
    icon: Tag,
    requiresPermission: "financial.manageCatalog",
    order: 1,
    group: financialGroup,
  },
  {
    id: "financial-invoices",
    path: "/financial/invoices",
    labelKey: "financial.nav.invoices",
    icon: Search,
    requiresPermission: "financial.read",
    order: 2,
    group: financialGroup,
  },
  {
    id: "financial-cash-sessions",
    path: "/financial/cash-sessions",
    labelKey: "financial.nav.cashSessions",
    icon: Banknote,
    requiresPermission: "financial.manageCash",
    order: 3,
    group: financialGroup,
  },
  {
    id: "financial-reports",
    path: "/financial/reports",
    labelKey: "financial.nav.reports",
    icon: BarChart3,
    requiresPermission: "financial.viewReports",
    order: 4,
    group: financialGroup,
  },
];
