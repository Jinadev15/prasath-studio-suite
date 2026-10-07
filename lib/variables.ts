// Types
import { SignatureColor, SignatureFont } from "@/types";

/**
 * Environment
 */
export const ENV = process.env.NODE_ENV;

/**
 * Canonical origin, used for metadataBase, canonicals, hreflang and the
 * sitemap. Read from the environment so a preview deployment does not
 * advertise the production URL as its canonical. No trailing slash.
 */
export const BASE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3001"
).replace(/\/$/, "");

/**
 * API endpoints
 */
export const GENERATE_PDF_API = "/api/document/generate";
export const SEND_PDF_API = "/api/document/send";
export const EXPORT_INVOICE_API = "/api/document/export";
export const WARM_BROWSER_API = "/api/document/warm";

/**
 * Local storage
 */
export const LOCAL_STORAGE_INVOICE_DRAFT_KEY = "studio:quotationDraft";
export const LOCAL_STORAGE_SAVED_KEY = "studio:savedQuotations";

/**
 * Trailing debounce for the draft autosave. Long enough that ordinary typing
 * never triggers a write, short enough that the "Saved" indicator settles
 * while the user is still looking at it.
 */
export const DRAFT_SAVE_DEBOUNCE_MS = 600;

/**
 * Google
 */
export const GOOGLE_SC_VERIFICATION = process.env.GOOGLE_SC_VERIFICATION;

/**
 * Nodemailer
 */
export const NODEMAILER_EMAIL = process.env.NODEMAILER_EMAIL;
export const NODEMAILER_PW = process.env.NODEMAILER_PW;

/**
 * I18N
 *
 * Two locales, both of them used.
 *
 * Upstream shipped eighteen, four of which could not render in the PDF at all
 * because it embeds only Latin fonts. This product serves Tamil Nadu, so the
 * second locale is Tamil and the PDF now embeds a Tamil face (see
 * scripts/build-pdf-css.mjs) — meaning a Tamil quotation actually prints in
 * Tamil rather than as missing glyphs.
 *
 * The Tamil message file is deliberately partial. `i18n/messages.ts` layers
 * each locale over English and treats an empty string as "not translated", so
 * a key that is not yet in `ta.json` renders readable English rather than an
 * error.
 */
export const LOCALES = [
    { code: "en", name: "English" },
    { code: "ta", name: "தமிழ்" },
];

export const DEFAULT_LOCALE = LOCALES[0].code;

/** Neither locale is right-to-left; kept so the templates stay direction-aware. */
export const RTL_LOCALES = new Set<string>();

export const dirForLocale = (locale: string): "rtl" | "ltr" =>
    RTL_LOCALES.has(locale) ? "rtl" : "ltr";

/**
 * Signature variables
 */
export const SIGNATURE_COLORS: SignatureColor[] = [
    { name: "black", label: "Black", color: "rgb(0, 0, 0)" },
    { name: "dark blue", label: "Dark Blue", color: "rgb(0, 0, 128)" },
    { name: "crimson", label: "Crimson", color: "#DC143C" },
];

export const SIGNATURE_FONTS: SignatureFont[] = [
    { name: "Dancing Script", variable: "var(--font-dancing-script)" },
    { name: "Parisienne", variable: "var(--font-parisienne)" },
    { name: "Great Vibes", variable: "var(--font-great-vibes)" },
    { name: "Alex Brush", variable: "var(--font-alex-brush)" },
];

/**
 * Date display.
 *
 * Day before month, which is how every date in India is written and read.
 * The en-US default ("January 15, 2026") is not merely unfamiliar here — mixed
 * with a numeric date elsewhere on the same page it is genuinely ambiguous.
 */
export const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
};

export const SHORT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
};

/**
 * Relationship options for the client block — who the studio is answering to.
 * A wedding has two families and they do not always agree.
 */
export const CLIENT_RELATIONSHIPS = [
    "Bride's family",
    "Groom's family",
    "Couple",
    "Company",
    "Event planner",
    "Other",
] as const;
