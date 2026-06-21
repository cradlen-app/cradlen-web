import { apiAuthFetch } from "@/infrastructure/http/api";

/**
 * Pregnancy lifecycle client. Activation is the "Create pregnancy profile"
 * drawer: it atomically reclassifies the visit's active journey as a pregnancy
 * (care_path = OBGYN_PREGNANCY) and opens an ACTIVE profile, which makes the
 * journey descriptor declare the clinical surface → the Pregnancy tab appears.
 */
export interface PregnancyProfile {
  journey_id: string;
  status: string;
  created_at: string;
}

export interface ActivatePregnancyBody {
  risk_level?: string;
  lmp?: string;
  blood_group_rh?: string;
  us_dating_date?: string;
  us_ga_weeks?: number;
  us_ga_days?: number;
  pregnancy_type?: string;
  number_of_fetuses?: number;
}

export interface DeliveryOutcome {
  mode?: string;
  date?: string;
  notes?: string;
}

export function activatePregnancy(
  visitId: string,
  body: ActivatePregnancyBody = {},
): Promise<{ data: PregnancyProfile }> {
  return apiAuthFetch<{ data: PregnancyProfile }>(
    `/visits/${encodeURIComponent(visitId)}/pregnancy`,
    { method: "POST", body: JSON.stringify(body) },
  );
}

export function closePregnancy(
  visitId: string,
  deliveryOutcome?: DeliveryOutcome,
): Promise<{ data: PregnancyProfile }> {
  return apiAuthFetch<{ data: PregnancyProfile }>(
    `/visits/${encodeURIComponent(visitId)}/pregnancy/close`,
    {
      method: "POST",
      body: JSON.stringify(
        deliveryOutcome ? { delivery_outcome: deliveryOutcome } : {},
      ),
    },
  );
}
