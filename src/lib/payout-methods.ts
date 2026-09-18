/**
 * Payout method catalog, shared by the Wallet screen, the withdrawal server
 * function and the admin panel so all three agree on which methods exist, what
 * each one requires, and how details are masked.
 *
 * Icons are intentionally plain monogram circles in the app's own palette — no
 * official PayPal / Amazon / Google Play / Bitcoin logo assets, to stay clear of
 * brand-guideline restrictions.
 */

export const PAYOUT_METHOD_TYPES = [
  "upi",
  "paypal",
  "bank",
  "amazon_gift_card",
  "google_play_gift_card",
  "bitcoin",
  "ethereum",
] as const;

export type PayoutMethodType = (typeof PAYOUT_METHOD_TYPES)[number];

/** Fields a payout method can capture. Maps 1:1 onto payout_methods columns. */
export type PayoutFieldName =
  | "holder_name"
  | "upi_id"
  | "paypal_email"
  | "account_number"
  | "country_bank_code"
  | "bank_name"
  | "country"
  | "gift_card_recipient_email"
  | "wallet_address";

export type PayoutField = {
  name: PayoutFieldName;
  label: string;
  placeholder: string;
  /** HTML input type — only used for keyboard hints. */
  inputType?: "text" | "email";
  maxLength: number;
};

export type PayoutMethodSpec = {
  type: PayoutMethodType;
  label: string;
  /** Short line shown under the label on the selection card. */
  tagline: string;
  /** Monogram shown in the icon circle. */
  monogram: string;
  /** Tailwind classes for the monogram circle (app palette only). */
  iconClass: string;
  /** false = shown but not selectable, no form, nothing stored. */
  available: boolean;
  /** Message surfaced when a coming-soon method is tapped. */
  comingSoonMessage?: string;
  fields: PayoutField[];
};

const HOLDER: PayoutField = {
  name: "holder_name",
  label: "Account holder name",
  placeholder: "Full name",
  maxLength: 80,
};

export const PAYOUT_METHODS: PayoutMethodSpec[] = [
  {
    type: "upi",
    label: "UPI",
    tagline: "Instant bank transfer via UPI",
    monogram: "U",
    iconClass: "bg-jade-gradient text-primary-foreground",
    available: true,
    fields: [{ name: "upi_id", label: "UPI ID", placeholder: "name@bank", maxLength: 120 }, HOLDER],
  },
  {
    type: "paypal",
    label: "PayPal",
    tagline: "Paid to your PayPal email",
    monogram: "P",
    iconClass: "bg-primary text-primary-foreground",
    available: true,
    fields: [
      {
        name: "paypal_email",
        label: "PayPal email",
        placeholder: "you@example.com",
        inputType: "email",
        maxLength: 200,
      },
      HOLDER,
    ],
  },
  {
    type: "bank",
    label: "Bank Transfer",
    tagline: "International bank / IBAN",
    monogram: "B",
    iconClass: "bg-mint-gradient text-primary-foreground",
    available: true,
    fields: [
      HOLDER,
      {
        name: "account_number",
        label: "Account number / IBAN",
        placeholder: "IBAN or account number",
        maxLength: 60,
      },
      {
        name: "country_bank_code",
        label: "SWIFT / BIC code",
        placeholder: "e.g. ABCDUS33",
        maxLength: 20,
      },
      { name: "bank_name", label: "Bank name", placeholder: "Bank name", maxLength: 120 },
      { name: "country", label: "Country", placeholder: "Country", maxLength: 80 },
    ],
  },
  {
    type: "amazon_gift_card",
    label: "Amazon Gift Card",
    tagline: "Code emailed to you",
    monogram: "A",
    iconClass: "bg-gold-gradient text-gold-foreground",
    available: true,
    fields: [
      {
        name: "gift_card_recipient_email",
        label: "Recipient email",
        placeholder: "Where we send the code",
        inputType: "email",
        maxLength: 200,
      },
    ],
  },
  {
    type: "google_play_gift_card",
    label: "Google Play Gift Card",
    tagline: "Code emailed to you",
    monogram: "G",
    iconClass: "bg-gold-gradient text-gold-foreground",
    available: true,
    fields: [
      {
        name: "gift_card_recipient_email",
        label: "Recipient email",
        placeholder: "Where we send the code",
        inputType: "email",
        maxLength: 200,
      },
    ],
  },
  {
    type: "bitcoin",
    label: "Bitcoin",
    tagline: "Sent to your BTC address",
    monogram: "₿",
    iconClass: "bg-gold-gradient text-gold-foreground",
    available: true,
    fields: [
      {
        name: "wallet_address",
        label: "BTC wallet address",
        placeholder: "bc1… or 1… / 3…",
        maxLength: 120,
      },
    ],
  },
  {
    type: "ethereum",
    label: "Ethereum",
    tagline: "Coming soon",
    monogram: "Ξ",
    iconClass: "bg-background-alt text-muted-foreground",
    available: false,
    comingSoonMessage: "Ethereum payouts are coming soon.",
    fields: [],
  },
];

export const AVAILABLE_PAYOUT_METHODS = PAYOUT_METHODS.filter((m) => m.available);
export const COMING_SOON_PAYOUT_METHODS = PAYOUT_METHODS.filter((m) => !m.available);

export function payoutMethodSpec(type: string | null | undefined): PayoutMethodSpec | null {
  return PAYOUT_METHODS.find((m) => m.type === type) ?? null;
}

/** Human label for a stored/snapshotted type, tolerant of legacy 'unknown'. */
export function payoutMethodLabel(type: string | null | undefined): string {
  return payoutMethodSpec(type)?.label ?? "Unknown method";
}

/* ---------------------------------------------------------------------------
 * Masking
 *
 * Every display path goes through these so full account numbers, emails and
 * wallet addresses are never rendered in the UI, the request snapshot, or the
 * admin panel.
 * ------------------------------------------------------------------------- */

/** `rahul@okaxis` -> `r****@okaxis` */
export function maskEmailLike(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  const at = raw.lastIndexOf("@");
  if (at <= 0) return maskTail(raw);
  const user = raw.slice(0, at);
  const domain = raw.slice(at);
  const head = user.slice(0, 1);
  return `${head}${"*".repeat(Math.max(3, Math.min(6, user.length - 1)))}${domain}`;
}

/** `1234567890124821` -> `•••• 4821` */
export function maskAccount(value: string): string {
  const raw = value.trim().replace(/\s+/g, "");
  if (!raw) return "";
  if (raw.length <= 4) return `•••• ${raw}`;
  return `•••• ${raw.slice(-4)}`;
}

/** `bc1qxy...8x2` -> `bc1q••••8x2` */
export function maskWalletAddress(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  if (raw.length <= 8) return raw;
  return `${raw.slice(0, 4)}••••${raw.slice(-3)}`;
}

/** Generic fallback: keep the first char, mask the middle. */
function maskTail(value: string): string {
  if (value.length <= 2) return value;
  return `${value.slice(0, 1)}${"*".repeat(Math.max(3, value.length - 2))}${value.slice(-1)}`;
}

/** The payout_methods columns this module reads. */
export type PayoutMethodRecord = {
  method_type: string;
  label?: string | null;
  holder_name?: string | null;
  upi_id?: string | null;
  paypal_email?: string | null;
  account_number?: string | null;
  country_bank_code?: string | null;
  bank_name?: string | null;
  country?: string | null;
  gift_card_recipient_email?: string | null;
  wallet_address?: string | null;
  /** Legacy India-only field, still read so old rows display sensibly. */
  ifsc?: string | null;
};

/**
 * One-line masked identifier for a saved method, e.g. `r****@upi`,
 * `•••• 4821`, `bc1q••••8x2`.
 */
export function maskPayoutMethod(method: PayoutMethodRecord): string {
  switch (method.method_type) {
    case "upi":
      return maskEmailLike(method.upi_id ?? "");
    case "paypal":
      return maskEmailLike(method.paypal_email ?? method.upi_id ?? "");
    case "bank":
      return maskAccount(method.account_number ?? "");
    case "amazon_gift_card":
    case "google_play_gift_card":
      return maskEmailLike(method.gift_card_recipient_email ?? "");
    case "bitcoin":
    case "ethereum":
      return maskWalletAddress(method.wallet_address ?? "");
    default:
      return method.account_number ? maskAccount(method.account_number) : "";
  }
}

/**
 * Masked-safe snapshot stored on the withdrawal request. Only ever contains
 * masked values plus non-sensitive context (bank name, country), so the audit
 * trail can never become a source of full payout credentials.
 */
export function buildPayoutSnapshot(method: PayoutMethodRecord): Record<string, string> {
  const snapshot: Record<string, string> = {
    method_type: method.method_type,
    masked: maskPayoutMethod(method),
  };
  if (method.label) snapshot["label"] = method.label;
  if (method.holder_name) snapshot["holder_name"] = method.holder_name;
  if (method.bank_name) snapshot["bank_name"] = method.bank_name;
  if (method.country) snapshot["country"] = method.country;
  if (method.country_bank_code) snapshot["country_bank_code"] = method.country_bank_code;
  return snapshot;
}
