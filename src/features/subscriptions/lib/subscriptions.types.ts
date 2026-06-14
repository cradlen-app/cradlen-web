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

export type CurrentSubscription = {
  id: string;
  status: SubscriptionStatus;
  starts_at: string;
  ends_at: string | null;
  trial_ends_at: string | null;
  plan: CurrentSubscriptionPlan;
};

export type PaymentProof = {
  id: string;
  url: string | null;
  content_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

export type SubscriptionPayment = {
  id: string;
  organization_id: string;
  subscription_plan_id: string;
  provider: PaymentProvider;
  billing_interval: BillingInterval;
  amount: string;
  currency: string;
  status: PaymentStatus;
  rejection_reason: string | null;
  verified_at: string | null;
  created_at: string;
  proofs?: PaymentProof[];
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

export type CreatePaymentRequest = {
  plan: string;
  provider: PaymentProvider;
};
