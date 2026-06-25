export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRED" | "CANCELLED";

export type PaymentStatus =
  | "PENDING"
  | "AWAITING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "CANCELLED";

export type PaymentProvider = "INSTAPAY" | "WALLET";

export type BillingInterval = "MONTHLY" | "YEARLY";

export type PlanPrice = {
  billing_interval: BillingInterval;
  price: string;
  currency: string;
};

export type Plan = {
  id: string;
  plan: string;
  max_organizations: number;
  max_branches: number;
  max_staff: number;
  prices: PlanPrice[];
};

export type CurrentSubscriptionPlan = {
  id: string;
  plan: string;
  max_organizations: number;
  max_branches: number;
  max_staff: number;
};

export type AddOnKind = "BRANCH_BUNDLE" | "EXTRA_USER";

export type EffectiveLimits = {
  max_branches: number;
  max_staff: number;
};

/** An add-on the org owns against its current subscription. */
export type OwnedAddOn = {
  id: string;
  code: string;
  name: string;
  kind: AddOnKind;
  quantity: number;
  ends_at: string | null;
};

/** An add-on purchasable on top of the current plan (full yearly price). */
export type AvailableAddOn = {
  id: string;
  code: string;
  name: string;
  kind: AddOnKind;
  delta_branches: number;
  delta_users: number;
  price: string;
  currency: string;
};

export type CurrentSubscription = {
  id: string;
  status: SubscriptionStatus;
  starts_at: string;
  ends_at: string | null;
  trial_ends_at: string | null;
  plan: CurrentSubscriptionPlan;
  effective_limits: EffectiveLimits;
  add_ons: OwnedAddOn[];
};

export type PaymentProof = {
  id: string;
  url: string | null;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type PaymentPurpose = "PLAN" | "ADD_ON" | "COMBINED";

export type PaymentItemKind = "PLAN" | "ADD_ON";

/** A line on a COMBINED checkout (plan + add-ons in one payment). */
export type SubscriptionPaymentItem = {
  id: string;
  kind: PaymentItemKind;
  subscription_plan_id: string | null;
  add_on_id: string | null;
  quantity: number;
  unit_amount: string;
  amount: string;
};

export type SubscriptionPayment = {
  id: string;
  organization_id: string;
  subscription_plan_id: string;
  purpose: PaymentPurpose;
  add_on_id: string | null;
  quantity: number;
  provider: PaymentProvider;
  billing_interval: BillingInterval;
  amount: string;
  currency: string;
  status: PaymentStatus;
  rejection_reason: string | null;
  verified_at: string | null;
  created_at: string;
  proofs?: PaymentProof[];
  items?: SubscriptionPaymentItem[];
};

export type PaymentInstructions = {
  provider: PaymentProvider;
  pay_to: string;
  amount: string;
  currency: string;
  reference: string;
  note: string;
};

export type CreatePaymentResponse = {
  payment: SubscriptionPayment;
  settlement_mode: "MANUAL_PROOF" | "GATEWAY";
  requires_proof: boolean;
  instructions?: PaymentInstructions;
  redirect_url?: string;
};

export type CombinedAddOnLine = { code: string; quantity: number };

export type CreatePaymentRequest = {
  plan: string;
  provider: PaymentProvider;
  /** When set, the payment is an add-on purchase (prorated server-side). */
  add_on_code?: string;
  quantity?: number;
  /**
   * When set alongside `plan`, the payment is a COMBINED checkout: the plan is
   * activated AND these add-ons granted in one atomic, single-proof payment
   * (e.g. switch to Individual while buying seats to keep all staff).
   */
  add_ons?: CombinedAddOnLine[];
};
