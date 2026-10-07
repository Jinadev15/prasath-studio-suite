import { z } from "zod";

import { GST_RATES, DEFAULT_GST_RATE, DEFAULT_SAC_CODE } from "@/lib/india/gst";
import { SIGNATURE_FONTS } from "@/lib/variables";

/**
 * The parts every document kind shares.
 *
 * Quotations, invoices and bookings all carry the same studio block, the same
 * base client block, the same theme and the same field-validation helpers.
 * These lived in three identical copies while they were three applications,
 * which is exactly the duplication that drifts — a field added to the studio
 * block reaches the invoice and not the booking sheet, and nobody notices
 * until a client asks why the GSTIN is missing from one of them.
 *
 * Sharing the *schema object*, not just its shape, also matters to
 * TypeScript: three structurally identical `z.object()` calls infer three
 * unrelated types, so a function taking "a document's studio block" could not
 * be written at all.
 *
 * Two conventions worth stating once, because every kind depends on them:
 *
 * Dates are stored as ISO `YYYY-MM-DD`. Upstream stored the *formatted* en-US
 * string and re-parsed it, which put a display decision in the wire format and
 * made `01/02/2026` from any other source unresolvably ambiguous.
 *
 * Totals are never stored. Upstream kept `subTotal` and `totalAmount` as
 * schema fields written by the form while the template recomputed them — two
 * sources for one figure, and the stale stored one silently wins on reload.
 * Every figure is derived by `computeTotals`, once.
 */

/** Roughly 2MB of binary once base64-decoded — generous for a logo, bounded. */
const MAX_IMAGE_CHARS = 3_000_000;

/**
 * Images are rendered as `<img src>` inside the HTML handed to Puppeteer, so an
 * arbitrary URL here means the *server* fetches it — a straightforward SSRF
 * into cloud metadata endpoints or internal services. The app only ever
 * produces base64 data URLs, so anything else is rejected.
 */
const imageDataUrl = z
    .string()
    .max(MAX_IMAGE_CHARS, { message: "Image is too large" })
    .refine(
        (value) =>
            value === "" || /^data:image\/[a-z0-9.+-]+;base64,/i.test(value),
        { message: "Must be an embedded image" }
    );

/**
 * Accepts a Date (what react-hook-form holds), a string or a number (what JSON
 * delivers over the wire) and normalises all three to ISO `YYYY-MM-DD`.
 *
 * `toISOString()` is deliberately not used: it converts to UTC first, so a date
 * picked as 1 January in IST (UTC+5:30) is stored as 31 December. The parts are
 * read in local time instead.
 */
const isoDate = z
    .union([z.date(), z.string(), z.number()])
    .pipe(z.coerce.date())
    .transform((date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    });

const optionalIsoDate = z
    .union([z.date(), z.string(), z.number(), z.null(), z.undefined()])
    .optional()
    .transform((value) => {
        if (value === null || value === undefined || value === "") return "";
        const date = new Date(value as string | number | Date);
        if (Number.isNaN(date.getTime())) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    });

const text = (max: number) => z.string().max(max).optional().default("");
const requiredText = (min: number, max: number, label: string) =>
    z
        .string()
        .min(min, { message: `${label} is required` })
        .max(max, { message: `${label} must be at most ${max} characters` });

/**
 * A number field that tolerates being empty.
 *
 * `z.coerce.number()` turns "" and undefined into NaN, which then fails the
 * inner check — so a row the user added and left blank blocked the whole
 * document with "Expected number, received nan". Since almost nothing is
 * required any more, blank has to mean "nothing entered", not "invalid".
 * Anything unparseable falls back rather than throwing.
 */
const num = (schema: z.ZodTypeAny = z.number(), fallback = 0) =>
    z.preprocess((value) => {
        if (value === "" || value === null || value === undefined)
            return fallback;
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }, schema);

const nonNegative = num(
    z.number().nonnegative({ message: "Must be zero or more" })
);

const gstRate = num(
    z.number().refine((r) => (GST_RATES as readonly number[]).includes(r), {
        message: "Not a GST slab",
    }),
    DEFAULT_GST_RATE
);

const CustomInputSchema = z.object({
    key: z.string().max(40),
    value: z.string().max(200),
});

/* ------------------------------------------------------------------ *
 * Studio — the parent company, snapshotted onto the document
 * ------------------------------------------------------------------ */

/**
 * A copy, not a reference.
 *
 * The studio's live profile will change — a new phone number, a new bank
 * account, a rebrand. A quotation sent in March must still render in October
 * exactly as the client received it, so the identity is frozen onto the
 * document at the moment it is created rather than looked up at render time.
 */
const BankSchema = z.object({
    accountName: text(80),
    accountNumber: text(30),
    ifsc: text(15),
    bankName: text(60),
    branch: text(60),
});

const StudioSchema = z.object({
    profileId: text(64),

    brandName: requiredText(2, 60, "Studio name"),
    legalName: text(80),
    tagline: text(120),
    logo: imageDataUrl.optional().default(""),

    phone: requiredText(6, 20, "Phone number"),
    altPhone: text(20),
    whatsapp: text(20),
    email: text(60),
    website: text(80),
    instagram: text(60),

    addressLine1: text(90),
    addressLine2: text(90),
    city: text(50),
    district: text(50),
    state: text(50),
    stateCode: text(2),
    pincode: text(10),

    gstin: text(15),
    pan: text(10),
    unregisteredNote: text(200),

    bank: BankSchema.optional(),
    upiId: text(80),
    upiQr: imageDataUrl.optional().default(""),

    signature: z.string().max(MAX_IMAGE_CHARS).optional().default(""),
    /** Interpolated into a font stack, so restricted to the fonts on offer. */
    signatureFontFamily: z
        .enum(SIGNATURE_FONTS.map((f) => f.name) as [string, ...string[]])
        .or(z.literal(""))
        .optional()
        .default(""),
    signatoryName: text(60),
    signatoryDesignation: text(60),
    seal: imageDataUrl.optional().default(""),
});

/* ------------------------------------------------------------------ *
 * Client — the family or company buying the work
 * ------------------------------------------------------------------ */

const ClientSchema = z.object({
    /** "Mr. Karthik & Ms. Divya", or a company name for corporate work. */
    name: requiredText(2, 90, "Client name"),
    contactPerson: text(60),
    /** Bride's family, groom's family, company — who the studio answers to. */
    relationship: text(40),

    phone: requiredText(6, 20, "Client phone"),
    altPhone: text(20),
    whatsapp: text(20),
    email: text(60),

    addressLine1: text(90),
    addressLine2: text(90),
    city: text(50),
    district: text(50),
    state: text(50),
    pincode: text(10),

    gstin: text(15),

    customInputs: z.array(CustomInputSchema).optional().default([]),
});


/* ------------------------------------------------------------------ *
 * Presentation
 * ------------------------------------------------------------------ */

const ThemeSchema = z.object({
    /** Interpolated into inline styles including in the PDF — hex only. */
    accentColor: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, { message: "Must be a hex colour" })
        .optional(),
    fontId: z
        .enum(["outfit", "plexSans", "sourceSerif", "plexMono", "notoTamil"])
        .optional(),
    density: z.enum(["compact", "comfortable", "spacious"]).optional(),
});

/* ------------------------------------------------------------------ *
 * Billing — shared by quotations and invoices
 * ------------------------------------------------------------------ */

/*
 * Almost nothing below is required.
 *
 * Only four fields block a document: the studio's name and phone, and the
 * client's name and phone. Everything else — the address, the line items, the
 * charges, the milestones — is optional, because a studio quoting from a
 * phone call has a name and a number and not much else, and refusing to
 * produce the document until every row is complete makes the tool useless at
 * exactly the moment it is wanted.
 *
 * The cost of that is empty rows, so the templates skip any row that carries
 * no content rather than printing a blank line (see `ItemsTable` and the other
 * tables in parts/index.tsx).
 */

/**
 * The schedule is the part of a photography quotation that a generic invoice
 * app has no place for, and the part a client reads first: which day, where,
 * and who is coming. Leaving it in a free-text notes field is how a studio
 * turns up to the wrong venue.
 */
const EventSchema = z.object({
    /** Catalogue id, or "other" with a custom label. */
    functionId: text(40),
    label: text(80),
    date: optionalIsoDate,
    startTime: text(10),
    endTime: text(10),
    venue: text(120),
    venueAddress: text(200),
    city: text(60),
    guestCount: num(z.number().nonnegative()),
    /** Crew plan in words: "2 candid + 1 traditional + drone". */
    crew: text(120),
    notes: text(300),
});
const ItemSchema = z.object({
    /** Catalogue id when it came from the picker; blank for a custom line. */
    serviceId: text(40),
    name: text(100),
    description: text(300),
    sac: z.string().max(10).optional().default(DEFAULT_SAC_CODE),
    unit: text(20),
    quantity: nonNegative,
    rate: nonNegative,
    discountPercent: num(z.number().min(0).max(100)),
    gstRate,
});
const OtherChargeSchema = z.object({
    label: text(60),
    value: nonNegative,
    gstRate,
});
const TimelineSchema = z.object({
    item: text(60),
    days: nonNegative,
});

export {
    num,
    EventSchema,
    ItemSchema,
    OtherChargeSchema,
    TimelineSchema,
    MAX_IMAGE_CHARS,
    imageDataUrl,
    isoDate,
    optionalIsoDate,
    text,
    requiredText,
    nonNegative,
    gstRate,
    CustomInputSchema,
    StudioSchema,
    ClientSchema,
    ThemeSchema,
};
