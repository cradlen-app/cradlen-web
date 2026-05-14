"use client";

import { useEffect, useRef } from "react";
import { useTemplateExecution } from "./TemplateExecutionContext";

/**
 * Watches every field flagged `config.logic.is_discriminator`. When any of
 * them changes, clears all non-SYSTEM state (formValues + searchState) while
 * preserving systemValues — mirroring the API's discriminator contract.
 */
export function useDiscriminatorReset(): void {
  const { template, state, resetAfterDiscriminator } = useTemplateExecution();

  const discriminatorCodes = useRef<string[]>([]);
  useEffect(() => {
    const codes: string[] = [];
    for (const section of template.sections) {
      for (const field of section.fields) {
        if (field.config?.logic?.is_discriminator) codes.push(field.code);
      }
    }
    discriminatorCodes.current = codes;
  }, [template]);

  const prevValues = useRef<Record<string, unknown>>({});
  // Seed initial snapshot once, so first mount doesn't trigger a reset.
  const seeded = useRef(false);
  useEffect(() => {
    if (!seeded.current) {
      const initial: Record<string, unknown> = {};
      for (const code of discriminatorCodes.current) {
        initial[code] = state.systemValues[code];
      }
      prevValues.current = initial;
      seeded.current = true;
      return;
    }

    let changed = false;
    const current: Record<string, unknown> = {};
    for (const code of discriminatorCodes.current) {
      current[code] = state.systemValues[code];
      if (prevValues.current[code] !== current[code]) changed = true;
    }
    prevValues.current = current;

    if (changed) {
      resetAfterDiscriminator(state.systemValues);
    }
    // We only react to systemValues for the watched discriminator codes.
    // Discriminators bound to formValues (e.g. would-be `care_path_code`) are
    // intentionally NOT supported here — wiping formValues would also wipe the
    // discriminator that triggered the reset, causing an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.systemValues]);
}
