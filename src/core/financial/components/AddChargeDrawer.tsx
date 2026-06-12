"use client";

import { useMemo, useState } from "react";
import { Dialog } from "radix-ui";
import { X, Loader2, Plus, Trash2, Pencil, Ban, FileMinus, Check } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/common/utils/utils";
import { Button } from "@/components/ui/button";

import { useServices } from "../hooks/useServices";
import { useResolvePrice } from "../hooks/useResolvePrice";
import {
  useCancelCharge,
  useCaptureCharge,
  useUpdateCharge,
  useVisitCharges,
  useVoidCharge,
  useWriteOffCharge,
} from "../hooks/useCharges";
import { formatMoney } from "../lib/format";
import type { Charge } from "../types/financial.types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  patientId: string;
  /** Rendering provider (Profile id) the charge is attributed to. */
  profileId: string;
  visitId: string;
};

const inputClass = cn(
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
  "placeholder:text-gray-400 outline-none transition-colors",
  "focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20",
);

export function AddChargeDrawer({
  open,
  onOpenChange,
  branchId,
  patientId,
  profileId,
  visitId,
}: Props) {
  const t = useTranslations("financial.charges");
  const tCommon = useTranslations("financial.common");

  const { services } = useServices({ active: true });
  const { charges } = useVisitCharges(open ? visitId : undefined);
  const capture = useCaptureCharge();
  const cancel = useCancelCharge();
  const update = useUpdateCharge();
  const voidCharge = useVoidCharge();
  const writeOff = useWriteOffCharge();

  const [serviceId, setServiceId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState("");

  const { resolvedPrice } = useResolvePrice(
    serviceId || null,
    branchId,
    profileId,
  );

  const effectivePrice = useMemo(() => {
    if (customPrice.trim() !== "") return Number(customPrice);
    return resolvedPrice?.price ?? null;
  }, [customPrice, resolvedPrice]);

  function resetForm() {
    setServiceId("");
    setQuantity(1);
    setCustomPrice("");
  }

  function handleAdd() {
    if (!serviceId) return;
    capture.mutate(
      {
        branch_id: branchId,
        patient_id: patientId,
        profile_id: profileId,
        visit_id: visitId,
        service_id: serviceId,
        quantity,
        unit_price:
          customPrice.trim() !== "" ? Number(customPrice) : undefined,
      },
      { onSuccess: resetForm },
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed inset-y-0 inset-e-0 z-51 flex w-full max-w-md flex-col bg-white shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-medium text-gray-900">
                {t("title")}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {t("subtitle")}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-900">
              <X className="size-5" aria-hidden="true" />
            </Dialog.Close>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {/* Add form */}
            <div className="space-y-3 rounded-xl border border-gray-100 p-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-700">
                  {t("serviceLabel")}
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t("selectService")}</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <div className="w-24">
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    {t("qtyLabel")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Number(e.target.value) || 1))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">
                    {t("customPriceLabel")}{" "}
                    <span className="text-gray-400">{tCommon("optional")}</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder={t("resolvedPrice")}
                    className={inputClass}
                  />
                </div>
              </div>

              {serviceId && (
                <p className="text-xs text-gray-500">
                  {effectivePrice != null
                    ? `${t("resolvedPrice")}: ${formatMoney(effectivePrice)}`
                    : t("noPrice")}
                </p>
              )}

              <Button
                type="button"
                onClick={handleAdd}
                disabled={!serviceId || capture.isPending}
                className="w-full"
              >
                {capture.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    {t("adding")}
                  </>
                ) : (
                  <>
                    <Plus className="size-4" aria-hidden="true" />
                    {t("add")}
                  </>
                )}
              </Button>
            </div>

            {/* Existing charges */}
            <div>
              <h3 className="mb-2 text-sm font-medium text-gray-700">
                {t("currentCharges")}
              </h3>
              {charges.length === 0 ? (
                <p className="text-sm text-gray-400">{t("noCharges")}</p>
              ) : (
                <ul className="space-y-1.5">
                  {charges.map((charge) => (
                    <ChargeRow
                      key={charge.id}
                      charge={charge}
                      onCancel={() => cancel.mutate(charge.id)}
                      onUpdate={(quantity) =>
                        update.mutate({ id: charge.id, payload: { quantity } })
                      }
                      onVoid={() => voidCharge.mutate(charge.id)}
                      onWriteOff={() => writeOff.mutate(charge.id)}
                      busy={
                        cancel.isPending ||
                        update.isPending ||
                        voidCharge.isPending ||
                        writeOff.isPending
                      }
                      statusLabel={t(`status.${charge.status}`)}
                      labels={{
                        cancel: t("cancelAria"),
                        edit: t("editAria"),
                        void: t("voidAria"),
                        writeOff: t("writeOffAria"),
                        save: t("saveAria"),
                      }}
                    />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ChargeRow({
  charge,
  onCancel,
  onUpdate,
  onVoid,
  onWriteOff,
  busy,
  statusLabel,
  labels,
}: {
  charge: Charge;
  onCancel: () => void;
  onUpdate: (quantity: number) => void;
  onVoid: () => void;
  onWriteOff: () => void;
  busy: boolean;
  statusLabel: string;
  labels: {
    cancel: string;
    edit: string;
    void: string;
    writeOff: string;
    save: string;
  };
}) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(charge.quantity);
  const lineTotal = charge.unit_price * charge.quantity;
  const isPending = charge.status === "PENDING";

  function save() {
    if (qty >= 1 && qty !== charge.quantity) onUpdate(qty);
    setEditing(false);
  }

  return (
    <li className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-800">{charge.description}</p>
        <p className="flex items-center gap-1 text-xs text-gray-400">
          {editing ? (
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              className="w-14 rounded border border-gray-200 px-1 py-0.5 text-xs"
            />
          ) : (
            charge.quantity
          )}{" "}
          × {formatMoney(charge.unit_price, charge.currency)}
          {" · "}
          {statusLabel}
        </p>
      </div>
      <span className="tabular-nums text-gray-700">
        {formatMoney(lineTotal, charge.currency)}
      </span>
      {isPending && (
        <div className="flex items-center gap-0.5">
          {editing ? (
            <button
              type="button"
              onClick={save}
              disabled={busy}
              aria-label={labels.save}
              className="inline-flex size-7 items-center justify-center rounded-lg text-emerald-500 transition-colors hover:bg-emerald-50 disabled:opacity-50"
            >
              <Check className="size-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy}
              aria-label={labels.edit}
              className="inline-flex size-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onWriteOff}
            disabled={busy}
            aria-label={labels.writeOff}
            className="inline-flex size-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
          >
            <FileMinus className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onVoid}
            disabled={busy}
            aria-label={labels.void}
            className="inline-flex size-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          >
            <Ban className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label={labels.cancel}
            className="inline-flex size-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
}
