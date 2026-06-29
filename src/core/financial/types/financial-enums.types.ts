// ── Enums ─────────────────────────────────────────────────────────────────────

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "VOID"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "VOID";

export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "BANK_TRANSFER"
  | "INSURANCE"
  | "OTHER";

export type ServiceType =
  | "CONSULTATION"
  | "PROCEDURE"
  | "LAB_TEST"
  | "IMAGING"
  | "ADMINISTRATIVE"
  | "OTHER";

export type PricingSource =
  | "PROVIDER_OVERRIDE"
  | "BRANCH_OVERRIDE"
  | "ORG_PRICE_LIST"
  | "CUSTOM";

export type InvoiceType =
  | "STANDARD"
  | "FOLLOWUP"
  | "PROFORMA"
  | "INSURANCE"
  | "REFUND";

export type DiscountType = "PERCENTAGE" | "FIXED";

export type ChargeStatus = "PENDING" | "INVOICED" | "VOID" | "WRITTEN_OFF";

export type ChargeSource = "DOCTOR" | "RECEPTION" | "SYSTEM";

export type RefundStatus = "PENDING" | "COMPLETED" | "FAILED" | "VOID";

export type ReceiptStatus = "ISSUED" | "VOID";

export type CashSessionStatus = "OPEN" | "CLOSED" | "RECONCILED";

