/**
 * The studio profile — the "parent company" that issues every document.
 *
 * Upstream treated the sender as just another seven-field address block typed
 * fresh onto each invoice. For a studio that is backwards: the client changes
 * every booking, the studio never does. Everything that is constant about the
 * business — logo, GSTIN, bank account, UPI, signature, seal, the terms it
 * always prints, its numbering series and its remembered rates — belongs in
 * one place that every new document reads from.
 *
 * Several profiles are supported because a studio commonly trades under more
 * than one name (a candid brand and a traditional one, or a second GSTIN), and
 * the alternative is keeping two browser profiles.
 *
 * Stored through lib/secureStore, encrypted at rest. That is not optional
 * here: this record holds a bank account number, an IFSC and a PAN. See that
 * module for what the encryption does and does not defend against.
 */

import { readSecure, removeSecure, writeSecure } from "@/lib/secureStore";
import {
    DEFAULT_GST_RATE,
    DEFAULT_SAC_CODE,
    type TaxMode,
} from "@/lib/india/gst";
import { DEFAULT_STATE_CODE, DEFAULT_STATE_NAME } from "@/lib/india/states";
import {
    DOCUMENT_KINDS,
    type DocumentKind,
} from "@/lib/documents/kinds";
import {
    DEFAULT_EXCLUSIONS,
    DEFAULT_INCLUSIONS,
    DEFAULT_PAYMENT_SCHEDULE,
    DEFAULT_TERMS,
    type PaymentMilestone,
} from "@/lib/photography/catalogue";

const STORAGE_KEY = "studio:profiles";
const ACTIVE_KEY = "studio:activeProfileId";

/* ------------------------------------------------------------------ *
 * Shape
 * ------------------------------------------------------------------ */

export type BankDetails = {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branch: string;
};

export type NumberSeries = {
    prefix: string;
    /** Tokens: {prefix} {fy} {yyyy} {mm} {seq}. */
    pattern: string;
    nextSequence: number;
    padding: number;
};

export type StudioProfile = {
    id: string;

    /* Identity */
    /** Trading name, the one printed large on the document. */
    brandName: string;
    /** Registered name, if it differs. Printed small, next to the GSTIN. */
    legalName: string;
    tagline: string;
    /** Data URL. Validated as an embedded image before it reaches the PDF. */
    logo: string;

    /* Contact */
    phone: string;
    altPhone: string;
    whatsapp: string;
    email: string;
    website: string;
    instagram: string;

    /* Address */
    addressLine1: string;
    addressLine2: string;
    city: string;
    district: string;
    state: string;
    stateCode: string;
    pincode: string;

    /* Statutory */
    gstin: string;
    pan: string;
    /** Printed under the totals when the studio is not GST-registered. */
    unregisteredNote: string;

    /* Money in */
    bank: BankDetails;
    upiId: string;
    /** Data URL of a UPI QR image, so a client can pay from the document. */
    upiQr: string;

    /* Sign-off */
    /** Data URL of a drawn/uploaded signature, or plain text for a typed one. */
    signature: string;
    signatureFontFamily: string;
    signatoryName: string;
    signatoryDesignation: string;
    /** Data URL of a round studio seal. */
    seal: string;

    /* Numbering — one independent series per document kind */
    /**
     * Quotations, invoices and bookings each need their own counter. Sharing
     * one meant a quotation could consume INV/2026-27/004, leaving a gap an
     * accountant will ask about. The map is keyed by document kind.
     */
    series: Record<DocumentKind, NumberSeries>;

    /* Document defaults */
    defaultTaxMode: TaxMode;
    defaultGstRate: number;
    defaultSac: string;
    defaultValidityDays: number;
    /** Invoice payment terms, as a preset label ("Due on receipt", "Net 15"). */
    defaultPaymentTerms: string;
    /** The declaration an Indian tax invoice carries above the signature. */
    defaultDeclaration: string;
    defaultTerms: string[];
    defaultInclusions: string[];
    defaultExclusions: string[];
    defaultPaymentSchedule: PaymentMilestone[];
    defaultNotes: string;

    /* Presentation defaults */
    accentColor: string;
    fontId: string;
    density: string;
    templateId: number;

    /**
     * Remembered rate per catalogue service id.
     *
     * The catalogue deliberately ships no prices — a plausible invented
     * default is the one a hurried user forgets to change. Instead the rate is
     * asked once and reused, so the second quotation is fast and the first is
     * honest.
     */
    rates: Record<string, number>;

    updatedAt: string;
};

/* ------------------------------------------------------------------ *
 * Defaults
 * ------------------------------------------------------------------ */

export function blankProfile(overrides: Partial<StudioProfile> = {}): StudioProfile {
    return {
        id: newId(),

        brandName: "",
        legalName: "",
        tagline: "",
        logo: "",

        phone: "",
        altPhone: "",
        whatsapp: "",
        email: "",
        website: "",
        instagram: "",

        addressLine1: "",
        addressLine2: "",
        city: "",
        district: "",
        state: DEFAULT_STATE_NAME,
        stateCode: DEFAULT_STATE_CODE,
        pincode: "",

        gstin: "",
        pan: "",
        unregisteredNote:
            "Not registered under GST. Tax not applicable on this document.",

        bank: {
            accountName: "",
            accountNumber: "",
            ifsc: "",
            bankName: "",
            branch: "",
        },
        upiId: "",
        upiQr: "",

        signature: "",
        signatureFontFamily: "",
        signatoryName: "",
        signatoryDesignation: "Proprietor",
        seal: "",

        series: blankSeries(),

        defaultTaxMode: "intra",
        defaultGstRate: DEFAULT_GST_RATE,
        defaultSac: DEFAULT_SAC_CODE,
        defaultValidityDays: 15,
        defaultPaymentTerms: "Due on receipt",
        defaultDeclaration:
            "We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.",
        defaultTerms: [...DEFAULT_TERMS],
        defaultInclusions: [...DEFAULT_INCLUSIONS],
        defaultExclusions: [...DEFAULT_EXCLUSIONS],
        defaultPaymentSchedule: DEFAULT_PAYMENT_SCHEDULE.map((m) => ({ ...m })),
        defaultNotes: "",

        accentColor: "#1F2937",
        fontId: "outfit",
        density: "comfortable",
        templateId: 1,

        rates: {},

        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

/** A fresh, independent series for each document kind. */
export function blankSeries(): Record<DocumentKind, NumberSeries> {
    return Object.fromEntries(
        DOCUMENT_KINDS.map((kind) => [
            kind.id,
            {
                prefix: kind.numberPrefix,
                pattern: "{prefix}/{fy}/{seq}",
                nextSequence: 1,
                padding: 3,
            },
        ])
    ) as Record<DocumentKind, NumberSeries>;
}

function newId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ------------------------------------------------------------------ *
 * Document numbering
 * ------------------------------------------------------------------ */

/**
 * The Indian financial year a date falls in, as "2026-27".
 *
 * April to March, not January to December. Every Indian document series is
 * numbered against it, and a studio that restarts its series in January has a
 * numbering gap its accountant has to explain.
 */
export function financialYear(date: Date = new Date()): string {
    const year = date.getFullYear();
    // getMonth() is zero-based; March is 2, so April onwards is >= 3.
    const startYear = date.getMonth() >= 3 ? year : year - 1;
    return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

/**
 * Renders a document number from the profile's pattern.
 *
 * Unknown tokens are left alone rather than blanked, so a typo in the pattern
 * shows up as a visible `{seqq}` instead of silently producing two documents
 * with the same number.
 */
export function formatDocumentNumber(
    series: NumberSeries,
    date: Date = new Date(),
    sequence = series.nextSequence
): string {
    const seq = String(Math.max(1, Math.floor(sequence))).padStart(
        Math.max(1, series.padding),
        "0"
    );

    const tokens: Record<string, string> = {
        "{prefix}": series.prefix,
        "{fy}": financialYear(date),
        "{yyyy}": String(date.getFullYear()),
        "{yy}": String(date.getFullYear() % 100).padStart(2, "0"),
        "{mm}": String(date.getMonth() + 1).padStart(2, "0"),
        "{seq}": seq,
    };

    return Object.entries(tokens).reduce(
        (pattern, [token, value]) => pattern.split(token).join(value),
        series.pattern || "{prefix}/{fy}/{seq}"
    );
}

/* ------------------------------------------------------------------ *
 * Derived views
 * ------------------------------------------------------------------ */

/** The address as the document prints it, one line per element. */
export function addressLines(profile: StudioProfile): string[] {
    const locality = [profile.city, profile.district]
        .map((p) => p.trim())
        .filter(Boolean)
        // "Coimbatore, Coimbatore" reads like a bug, because it is one.
        .filter((part, index, all) => all.indexOf(part) === index)
        .join(", ");

    const region = [locality, profile.state].filter(Boolean).join(", ");
    const withPin = [region, profile.pincode].filter(Boolean).join(" - ");

    return [profile.addressLine1, profile.addressLine2, withPin]
        .map((line) => line.trim())
        .filter(Boolean);
}

/** Single-line address, for compact templates and email signatures. */
export const addressOneLine = (profile: StudioProfile) =>
    addressLines(profile).join(", ");

/** True when there is enough here to put on a document a client will read. */
export function isProfileUsable(profile: StudioProfile): boolean {
    return Boolean(
        profile.brandName.trim() &&
            profile.phone.trim() &&
            addressLines(profile).length > 0
    );
}

/** What is still missing, for the settings page's checklist. */
export function profileGaps(profile: StudioProfile): string[] {
    const gaps: string[] = [];
    if (!profile.brandName.trim()) gaps.push("Studio name");
    if (!profile.logo) gaps.push("Logo");
    if (!profile.phone.trim()) gaps.push("Phone number");
    if (!addressLines(profile).length) gaps.push("Address");
    if (!profile.gstin.trim() && profile.defaultTaxMode !== "exempt")
        gaps.push("GSTIN (or switch the tax default to “No GST”)");
    if (!profile.bank.accountNumber.trim() && !profile.upiId.trim())
        gaps.push("Bank account or UPI ID");
    if (!profile.signature && !profile.signatoryName.trim())
        gaps.push("Signature or signatory name");
    return gaps;
}

/* ------------------------------------------------------------------ *
 * Normalisation
 * ------------------------------------------------------------------ */

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null;

/**
 * Coerces whatever is in storage into a complete profile.
 *
 * Defensive by design: this record may have been written by an earlier build,
 * hand-edited in devtools, or imported from a JSON file a studio was emailed.
 * Every field falls back to the blank default, so a partial or malformed entry
 * loads with holes rather than crashing the settings page.
 */
/**
 * Reads the numbering series, migrating a profile saved before there were
 * three of them.
 *
 * Such a profile has flat `numberPrefix` / `nextSequence` fields that belonged
 * to the quotation app. Those are carried into the quotation series so a
 * studio's existing counter is not silently reset to 1 and does not start
 * re-issuing numbers it has already used; the other two kinds start fresh.
 */
function normaliseSeries(
    input: Record<string, unknown>
): Record<DocumentKind, NumberSeries> {
    const series = blankSeries();
    const stored = isRecord(input.series) ? input.series : null;

    for (const kind of DOCUMENT_KINDS) {
        const entry = stored && isRecord(stored[kind.id]) ? stored[kind.id] : null;

        if (entry) {
            const nextSequence = Number((entry as Record<string, unknown>).nextSequence);
            const padding = Number((entry as Record<string, unknown>).padding);
            series[kind.id] = {
                prefix:
                    typeof (entry as Record<string, unknown>).prefix === "string"
                        ? ((entry as Record<string, unknown>).prefix as string)
                        : kind.numberPrefix,
                pattern:
                    typeof (entry as Record<string, unknown>).pattern === "string"
                        ? ((entry as Record<string, unknown>).pattern as string)
                        : "{prefix}/{fy}/{seq}",
                nextSequence: Number.isFinite(nextSequence)
                    ? Math.max(1, Math.floor(nextSequence))
                    : 1,
                padding: Number.isFinite(padding)
                    ? Math.min(8, Math.max(1, Math.floor(padding)))
                    : 3,
            };
            continue;
        }

        // Pre-merge profile: the flat fields were the quotation's series.
        if (kind.id === "quotation") {
            const legacySeq = Number(input.nextSequence);
            const legacyPad = Number(input.sequencePadding);
            series.quotation = {
                prefix:
                    typeof input.numberPrefix === "string" && input.numberPrefix
                        ? input.numberPrefix
                        : kind.numberPrefix,
                pattern:
                    typeof input.numberPattern === "string" && input.numberPattern
                        ? input.numberPattern
                        : "{prefix}/{fy}/{seq}",
                nextSequence: Number.isFinite(legacySeq)
                    ? Math.max(1, Math.floor(legacySeq))
                    : 1,
                padding: Number.isFinite(legacyPad)
                    ? Math.min(8, Math.max(1, Math.floor(legacyPad)))
                    : 3,
            };
        }
    }

    return series;
}

export function normaliseProfile(input: unknown): StudioProfile {
    const base = blankProfile();
    if (!isRecord(input)) return base;

    const str = (key: keyof StudioProfile, fallback = "") =>
        typeof input[key] === "string" ? (input[key] as string) : fallback;

    const strArray = (key: keyof StudioProfile, fallback: string[]) =>
        Array.isArray(input[key])
            ? (input[key] as unknown[]).filter(
                  (v): v is string => typeof v === "string"
              )
            : fallback;

    const bank = isRecord(input.bank) ? input.bank : {};
    const bankStr = (key: keyof BankDetails) =>
        typeof bank[key] === "string" ? (bank[key] as string) : "";

    const rates: Record<string, number> = {};
    if (isRecord(input.rates)) {
        for (const [key, value] of Object.entries(input.rates)) {
            const n = Number(value);
            if (Number.isFinite(n) && n >= 0) rates[key] = n;
        }
    }

    const schedule = Array.isArray(input.defaultPaymentSchedule)
        ? (input.defaultPaymentSchedule as unknown[])
              .filter(isRecord)
              .map((m) => ({
                  label: typeof m.label === "string" ? m.label : "",
                  percent: Number.isFinite(Number(m.percent))
                      ? Number(m.percent)
                      : 0,
                  due: typeof m.due === "string" ? m.due : "",
              }))
              .filter((m) => m.label)
        : base.defaultPaymentSchedule;

    const num = (key: keyof StudioProfile, fallback: number) => {
        const n = Number(input[key]);
        return Number.isFinite(n) ? n : fallback;
    };

    return {
        ...base,
        id: str("id") || base.id,

        brandName: str("brandName"),
        legalName: str("legalName"),
        tagline: str("tagline"),
        logo: str("logo"),

        phone: str("phone"),
        altPhone: str("altPhone"),
        whatsapp: str("whatsapp"),
        email: str("email"),
        website: str("website"),
        instagram: str("instagram"),

        addressLine1: str("addressLine1"),
        addressLine2: str("addressLine2"),
        city: str("city"),
        district: str("district"),
        state: str("state", base.state),
        stateCode: str("stateCode", base.stateCode),
        pincode: str("pincode"),

        gstin: str("gstin").toUpperCase(),
        pan: str("pan").toUpperCase(),
        unregisteredNote: str("unregisteredNote", base.unregisteredNote),

        bank: {
            accountName: bankStr("accountName"),
            accountNumber: bankStr("accountNumber"),
            ifsc: bankStr("ifsc").toUpperCase(),
            bankName: bankStr("bankName"),
            branch: bankStr("branch"),
        },
        upiId: str("upiId"),
        upiQr: str("upiQr"),

        signature: str("signature"),
        signatureFontFamily: str("signatureFontFamily"),
        signatoryName: str("signatoryName"),
        signatoryDesignation: str("signatoryDesignation", base.signatoryDesignation),
        seal: str("seal"),

        series: normaliseSeries(input),

        defaultTaxMode: (["intra", "inter", "exempt"] as const).includes(
            input.defaultTaxMode as TaxMode
        )
            ? (input.defaultTaxMode as TaxMode)
            : base.defaultTaxMode,
        defaultGstRate: num("defaultGstRate", base.defaultGstRate),
        defaultSac: str("defaultSac", base.defaultSac),
        defaultValidityDays: Math.max(
            0,
            Math.floor(num("defaultValidityDays", base.defaultValidityDays))
        ),
        defaultPaymentTerms: str(
            "defaultPaymentTerms",
            base.defaultPaymentTerms
        ),
        defaultDeclaration: str("defaultDeclaration", base.defaultDeclaration),
        defaultTerms: strArray("defaultTerms", base.defaultTerms),
        defaultInclusions: strArray("defaultInclusions", base.defaultInclusions),
        defaultExclusions: strArray("defaultExclusions", base.defaultExclusions),
        defaultPaymentSchedule: schedule,
        defaultNotes: str("defaultNotes"),

        accentColor: /^#[0-9a-fA-F]{6}$/.test(str("accentColor"))
            ? str("accentColor")
            : base.accentColor,
        fontId: str("fontId", base.fontId),
        density: str("density", base.density),
        templateId: Math.max(1, Math.floor(num("templateId", base.templateId))),

        rates,

        updatedAt: str("updatedAt", base.updatedAt),
    };
}

/* ------------------------------------------------------------------ *
 * Store
 * ------------------------------------------------------------------ */

export async function readProfiles(): Promise<StudioProfile[]> {
    const parsed = await readSecure<unknown>(STORAGE_KEY);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normaliseProfile);
}

export async function writeProfiles(profiles: StudioProfile[]): Promise<boolean> {
    return writeSecure(STORAGE_KEY, profiles);
}

export async function saveProfile(profile: StudioProfile): Promise<StudioProfile[]> {
    const stamped = { ...profile, updatedAt: new Date().toISOString() };
    const existing = await readProfiles();
    const index = existing.findIndex((p) => p.id === stamped.id);

    const next =
        index === -1
            ? [...existing, stamped]
            : existing.map((p, i) => (i === index ? stamped : p));

    await writeProfiles(next);
    return next;
}

export async function deleteProfile(id: string): Promise<StudioProfile[]> {
    const next = (await readProfiles()).filter((p) => p.id !== id);
    await writeProfiles(next);

    if ((await readActiveProfileId()) === id) {
        await setActiveProfileId(next[0]?.id ?? null);
    }
    return next;
}

export async function readActiveProfileId(): Promise<string | null> {
    return (await readSecure<string>(ACTIVE_KEY)) ?? null;
}

export async function setActiveProfileId(id: string | null): Promise<void> {
    if (id === null) {
        await removeSecure(ACTIVE_KEY);
        return;
    }
    await writeSecure(ACTIVE_KEY, id);
}

/**
 * The profile a new document should use.
 *
 * Falls back to the first saved profile when the active id points at one that
 * has since been deleted, and to null when nothing is saved at all — the form
 * reads that as "send the user to settings first".
 */
export async function readActiveProfile(): Promise<StudioProfile | null> {
    const profiles = await readProfiles();
    if (!profiles.length) return null;

    const activeId = await readActiveProfileId();
    return profiles.find((p) => p.id === activeId) ?? profiles[0];
}

/** Advances one kind's series after a document of that kind is issued. */
export async function consumeSequence(
    profileId: string,
    kind: DocumentKind
): Promise<void> {
    const profiles = await readProfiles();
    if (!profiles.some((p) => p.id === profileId)) return;

    await writeProfiles(
        profiles.map((p) =>
            p.id === profileId
                ? {
                      ...p,
                      series: {
                          ...p.series,
                          [kind]: {
                              ...p.series[kind],
                              nextSequence: p.series[kind].nextSequence + 1,
                          },
                      },
                  }
                : p
        )
    );
}

/** Stores the rate a user just typed, so the next quotation starts from it. */
export async function rememberRate(
    profileId: string,
    serviceId: string,
    rate: number
): Promise<void> {
    if (!Number.isFinite(rate) || rate <= 0) return;

    const profiles = await readProfiles();
    await writeProfiles(
        profiles.map((p) =>
            p.id === profileId
                ? { ...p, rates: { ...p.rates, [serviceId]: rate } }
                : p
        )
    );
}

/* ------------------------------------------------------------------ *
 * Portability
 * ------------------------------------------------------------------ */

/**
 * The export omits nothing, logo and signature included, so a studio can move
 * to a new laptop or hand setup to someone else by sending one file.
 *
 * It therefore contains the bank account and PAN in the clear. The download
 * is named to say so, and the UI warns before producing it — a file called
 * "profile.json" gets forwarded over WhatsApp without a second thought.
 */
export type ProfileExport = {
    kind: "studio-profile-export";
    version: 1;
    exportedAt: string;
    profiles: StudioProfile[];
};

export function buildProfileExport(profiles: StudioProfile[]): ProfileExport {
    return {
        kind: "studio-profile-export",
        version: 1,
        exportedAt: new Date().toISOString(),
        profiles,
    };
}

export function parseProfileExport(raw: string): StudioProfile[] {
    const parsed: unknown = JSON.parse(raw);

    // Accept both the wrapped export and a bare array, since someone will
    // hand-edit the file and strip the wrapper.
    const list = Array.isArray(parsed)
        ? parsed
        : isRecord(parsed) && Array.isArray(parsed.profiles)
          ? parsed.profiles
          : null;

    if (!list) throw new Error("Not a studio profile export");

    const profiles = list.map(normaliseProfile).filter((p) => p.brandName.trim());
    if (!profiles.length) throw new Error("No usable profiles in that file");

    return profiles;
}
