import type { FormFieldDto } from "../templates/template.types";

export interface FieldInputProps {
  field: FormFieldDto;
  value: unknown;
  onChange: (value: unknown) => void;
  required: boolean;
  disabled: boolean;
  error?: string;
}
