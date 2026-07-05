import { fireEvent, screen } from "@testing-library/react";
import { useForm, useFieldArray } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { useResolvePriceMock, useProviderServicesMock } = vi.hoisted(() => ({
  useResolvePriceMock: vi.fn(),
  useProviderServicesMock: vi.fn(),
}));

vi.mock("../hooks/useResolvePrice", () => ({
  useResolvePrice: (...args: unknown[]) => useResolvePriceMock(...args),
}));
vi.mock("../hooks/useAuthorizations", () => ({
  useProviderServices: (profileId: string | undefined) =>
    useProviderServicesMock(profileId),
}));

import { InvoiceLineItemsEditor } from "./InvoiceLineItemsEditor";
import type { InvoiceFormValues } from "./InvoiceDrawer";

type Item = InvoiceFormValues["items"][number];

function Harness({ initialItems = [] as Item[] }: { initialItems?: Item[] }) {
  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      patient_id: "pat-1",
      currency: "EGP",
      invoice_type: "STANDARD",
      discount_type: "NONE",
      discount_value: 0,
      items: initialItems,
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });
  return (
    <InvoiceLineItemsEditor
      control={form.control}
      setValue={form.setValue}
      getValues={form.getValues}
      fields={fields}
      append={append}
      remove={remove}
      branchId="br-1"
      profileId="doc-1"
      currency="EGP"
    />
  );
}

const AUTHS = [
  {
    id: "auth-1",
    service: { id: "svc-1", name: "Ultrasound", code: "US-01", service_type: "IMAGING" },
  },
];

describe("InvoiceLineItemsEditor", () => {
  beforeEach(() => {
    useResolvePriceMock.mockReturnValue({ resolvedPrice: undefined, isLoading: false });
    useProviderServicesMock.mockReturnValue({ authorizations: AUTHS });
  });

  it("renders the empty state when there are no line items", () => {
    renderWithIntl(<Harness />);
    expect(
      screen.getByText("No line items yet. Add a service or custom line below."),
    ).toBeInTheDocument();
  });

  it("appends a blank service row when Add Service is clicked", () => {
    renderWithIntl(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Add Service" }));
    // A blank row shows the placeholder service trigger.
    expect(screen.getByText("Select service…")).toBeInTheDocument();
  });

  it("renders an existing line item with its computed line total", () => {
    renderWithIntl(
      <Harness
        initialItems={[
          {
            service_id: "svc-1",
            description: "Ultrasound",
            quantity: 2,
            unit_price: 100,
            discount_amount: undefined,
            pricing_source: undefined,
          },
        ]}
      />,
    );
    expect(screen.getByText("Ultrasound")).toBeInTheDocument();
    // 2 × 100 = 200
    expect(screen.getByText("EGP 200.00")).toBeInTheDocument();
  });

  it("lists the provider's authorized services in the picker and selects one", () => {
    renderWithIntl(
      <Harness
        initialItems={[
          {
            service_id: "",
            description: "",
            quantity: 1,
            unit_price: 0,
            discount_amount: undefined,
            pricing_source: undefined,
          },
        ]}
      />,
    );
    // Open the combobox.
    fireEvent.click(screen.getByText("Select service…"));
    const option = screen.getByRole("button", { name: /Ultrasound/ });
    fireEvent.mouseDown(option);
    // After selecting, the trigger reflects the chosen service name.
    expect(screen.getByText("Ultrasound")).toBeInTheDocument();
  });

  it("fills the row unit price from the resolved price after selecting a service", () => {
    // Resolve a configured price once a service id is selected.
    useResolvePriceMock.mockImplementation((serviceId?: string) =>
      serviceId
        ? {
            resolvedPrice: { price: 100, currency: "EGP", source: "ORG_PRICE_LIST" },
            isLoading: false,
          }
        : { resolvedPrice: undefined, isLoading: false },
    );
    renderWithIntl(
      <Harness
        initialItems={[
          {
            service_id: "",
            description: "",
            quantity: 1,
            unit_price: 0,
            discount_amount: undefined,
            pricing_source: undefined,
          },
        ]}
      />,
    );
    fireEvent.click(screen.getByText("Select service…"));
    fireEvent.mouseDown(screen.getByRole("button", { name: /Ultrasound/ }));

    // Regression: writing the resolved price must re-render the row Controller,
    // so the unit-price input reflects it (not a stale 0) and the warning is gone.
    expect(screen.getByLabelText("Unit Price")).toHaveValue(100);
    expect(screen.queryByText("No price configured")).not.toBeInTheDocument();
  });
});
