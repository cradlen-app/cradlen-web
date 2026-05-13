"use client";

import type { ReactNode } from "react";
import { SectionTitle } from "../fields/field-shell";

interface Props {
  title: string;
  children: ReactNode;
}

export function SectionContainer({ title, children }: Props) {
  return (
    <section className="space-y-3">
      <SectionTitle title={title} />
      <div className="grid grid-cols-2 gap-x-8 gap-y-3">{children}</div>
    </section>
  );
}
