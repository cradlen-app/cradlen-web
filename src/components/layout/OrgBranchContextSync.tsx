"use client";

import { useEffect } from "react";
import { useAuthContextStore } from "@/features/auth/store/authContextStore";

type Props = {
  orgId: string;
  branchId: string;
  children: React.ReactNode;
};

export function OrgBranchContextSync({ orgId, branchId, children }: Props) {
  const setContext = useAuthContextStore((s) => s.setContext);
  const storeOrgId = useAuthContextStore((s) => s.accountId);
  const storeBranchId = useAuthContextStore((s) => s.branchId);

  useEffect(() => {
    if (storeOrgId !== orgId || storeBranchId !== branchId) {
      const { profileId } = useAuthContextStore.getState();
      setContext({ accountId: orgId, branchId, profileId: profileId ?? "" });
    }
  }, [orgId, branchId, storeOrgId, storeBranchId, setContext]);

  return <>{children}</>;
}
