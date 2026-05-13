import { apiAuthFetch } from "@/infrastructure/http/api";
import type { FormTemplateDto, FormTemplateResponse } from "./template.types";

export async function fetchFormTemplate(
  code: string,
  extension?: string | null,
): Promise<FormTemplateDto> {
  const query = extension ? `?extension=${encodeURIComponent(extension)}` : "";
  const res = await apiAuthFetch<FormTemplateResponse>(
    `/form-templates/${code}${query}`,
  );
  return res.data;
}
