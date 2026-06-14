"use client";

import type {
  PrescriptionDocument as PrescriptionDocumentData,
  PrescriptionTemplate,
} from "../../types/visits.api.types";
import { PRESCRIPTION_BLOCKS, blockSeparatorClass } from "./blocks";

type Props = {
  template: PrescriptionTemplate;
  document: PrescriptionDocumentData;
};

/**
 * Renders a prescription as the ordered blocks declared by its layout template.
 * This is the single rendering path: the v1 system-default template and any
 * future doctor-designed template both flow through here — only the `blocks`
 * differ. The modal owns fetch/print/chrome; this component owns layout.
 */
export function PrescriptionDocument({ template, document }: Props) {
  const blocks = template.layout?.blocks ?? [];

  // Drop blocks that are hidden, unknown, or render nothing, so dividers never
  // leave an empty gap.
  const rendered = blocks
    .filter((b) => b.visible !== false && PRESCRIPTION_BLOCKS[b.type])
    .map((b) => {
      const Block = PRESCRIPTION_BLOCKS[b.type];
      const node = <Block document={document} />;
      return { key: b.type, node };
    });

  return (
    // In print, become a full-height flex column so the footer block (which gets
    // `print:mt-auto`) is pushed to the bottom of the page.
    <div className="space-y-4 print:flex print:min-h-full print:flex-1 print:flex-col">
      {rendered.map((b, i) => (
        <div
          key={`${b.key}-${i}`}
          className={`${blockSeparatorClass(i)} empty:hidden ${
            b.key === "footer" ? "print:mt-auto!" : ""
          }`}
        >
          {b.node}
        </div>
      ))}
    </div>
  );
}
