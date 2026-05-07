"use client";

import { createContext, useContext, useState } from "react";

type SidebarCtx = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
};

const SidebarContext = createContext<SidebarCtx | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarContext
      value={{
        collapsed,
        setCollapsed,
        mobileOpen,
        openMobile: () => setMobileOpen(true),
        closeMobile: () => setMobileOpen(false),
      }}
    >
      {children}
    </SidebarContext>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be inside SidebarProvider");
  return ctx;
}
