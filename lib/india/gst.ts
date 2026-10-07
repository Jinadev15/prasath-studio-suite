/**
 * GST computation and Indian business-identity validation.
 *
 * This is the single source of truth for every figure that appears on a
 * document. The form summary, the live preview and the PDF all call
 * `computeTotals` with the same input, so there is no second implementation
 * that can disagree with the first — upstream recalculated totals in the form
 * and again in the template, which is exactly how a preview comes to show a
 * different number from the PDF a client receives.
 *
 * No React, no Next.js: this runs in the browser and inside
 * `renderToStaticMarkup` on the server.
 */

import { toPaiseRounded } from "./currency";
import { DEFAULT_STATE_CODE, stateByCode, stateByName } from "./states";

/* ------------------------------------------------------------------ *
 * Tax mode
 * ------------------------------------------------------------------ */

/**
 * `intra` — supplier and place of supply in the same state: CGST + SGST, each
 *           half the rate. The ordinary case for a Tamil Nadu studio shooting
 *           a Tamil Nadu wedding.
 * `inter` — different states: a single IGST at the full rate.
 * `exempt`— the studio is not GST-registered (below the threshold) or the
 *           supply is being billed without tax. No tax rows are rendered at
 *           all, rather than rows of zeroes.
 */
export type TaxMode = "intra" | "inter" | "exempt";

export const TAX_MODES: { value: TaxMode; label: string; hint: string }[] = [
    {
        value: "intra",
        label: "Within Tamil Nadu (CGST + SGST)",
        hint: "Client's place of supply is the same state as the studio",
    },
    {
        value: "inter",
        label: "Other state (IGST)",
        hint: "Client's place of supply is a different state",
    },
    {
        value: "exempt",
        label: "No GST",
        hint: "Studio is not registered, or billing without tax",
    },
];

/** The slabs GST actually uses. Photography services sit at 18%. */
export const GST_RATES = [0, 5, 12, 18, 28] as const;
export const DEFAULT_GST_RATE = 18;

/* ------------------------------------------------------------------ *
 * SAC codes
 * ------------------------------------------------------------------ */

/**
 * Service Accounting Codes a wedding and event studio actually bills under.
 *
 * 998383 is the one that covers a wedding shoot and is the default. The others
 * are here because a studio that also does portrait sittings, product work or
 * album reprints is billing those under different codes, and a tax invoice
 * that puts everything under one code is wrong in a way that only surfaces at
 * assessment.
 */
export type SacCode = {
    code: string;
    label: string;
    gstRate: number;
};

export const SAC_CODES: SacCode[] = [
    {
        code: "998383",
        label: "Event photography & videography services",
        gstRate: 18,
    },
    { code: "998381", label: "Portrait photography services", gstRate: 18 },
    {
        code: "998382",
        label: "Advertising & related photography services",
        gstRate: 18,
    },
    {
        code: "998384",
        label: "Specialty photography (aerial, underwater, drone)",
        gstRate: 18,
    },
    {
        code: "998385",
        label: "Restoration & retouching of photography",
        gstRate: 18,
    },
    { code: "998386", label: "Photographic processing services", gstRate: 18 },
    {
        code: "998387",
        label: "Other photography, videography & processing",
        gstRate: 18,
    },
    { code: "998391", label: "Specialty design services", gstRate: 18 },
    { code: "998399", label: "Other professional & technical services", gstRate: 18 },
    { code: "4911", label: "Printed albums & photo books (goods)", gstRate: 12 },
    { code: "9983", label: "Other professional services (group)", gstRate: 18 },
];

export const DEFAULT_SAC_CODE = "998383";

export function sacByCode(code: string | undefined | null) {
    return code ? SAC_CODES.find((s) => s.code === code.trim()) : undefined;
}

/* ------------------------------------------------------------------ *
 * Identity validation
 * ------------------------------------------------------------------ */

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GSTIN_SHAPE =
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/**
 * The 15th character of a GSTIN, computed from the first 14.
 *
 * Weighted alternating 1/2 over base-36 digits, folding the carry back in —
 * the same scheme the GST portal uses. Checking it catches the transposed
 * digit that a shape-only regex waves through, which matters because an
 * invoice carrying a malformed GSTIN is a rejected input credit for the client.
 */
function gstinCheckDigit(first14: string): string {
    const mod = GSTIN_CHARS.length;
    let factor = 2;
    let sum = 0;

    for (let i = first14.length - 1; i >= 0; i--) {
        const codePoint = GSTIN_CHARS.indexOf(first14[i]);
        if (codePoint < 0) return "";

        let addend = factor * codePoint;
        factor = factor === 2 ? 1 : 2;
        addend = Math.floor(addend / mod) + (addend % mod);
        sum += addend;
    }

    return GSTIN_CHARS[(mod - (sum % mod)) % mod];
}

export type GstinCheck = {
    valid: boolean;
    /** Present whenever the first two digits name a real state. */
    stateCode?: string;
    stateName?: string;
    /** Populated on failure, for the field message. */
    reason?: string;
};

export function checkGstin(raw: string | undefined | null): GstinCheck {
    const gstin = (raw ?? "").trim().toUpperCase();
    if (!gstin) return { valid: false, reason: "GSTIN is empty" };

    if (gstin.length !== 15)
        return { valid: false, reason: "A GSTIN is 15 characters" };

    if (!GSTIN_SHAPE.test(gstin))
        return { valid: false, reason: "Not a valid GSTIN format" };

    const state = stateByCode(gstin.slice(0, 2));
    if (!state)
        return {
            valid: false,
            reason: `"${gstin.slice(0, 2)}" is not an Indian state code`,
        };

    if (gstinCheckDigit(gstin.slice(0, 14)) !== gstin[14])
        return {
            valid: false,
            stateCode: state.code,
            stateName: state.name,
            reason: "Checksum does not match — check for a typo",
        };

    return { valid: true, stateCode: state.code, stateName: state.name };
}

export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
/** 10-digit Indian mobile, optionally with +91 / 0 and separators. */
export const INDIAN_PHONE_REGEX =
    /^(?:\+?91[-\s]?|0)?[6-9]\d{4}[-\s]?\d{5}$/;
export const UPI_ID_REGEX = /^[\w.\-]{2,64}@[a-zA-Z][a-zA-Z0-9]{1,32}$/;

export const isPan = (v: string) => PAN_REGEX.test((v ?? "").trim().toUpperCase());
export const isIfsc = (v: string) => IFSC_REGEX.test((v ?? "").trim().toUpperCase());
export const isPincode = (v: string) => PINCODE_REGEX.test((v ?? "").trim());
export const isIndianPhone = (v: string) =>
    INDIAN_PHONE_REGEX.test((v ?? "").replace(/\s|-/g, ""));
export const isUpiId = (v: string) => UPI_ID_REGEX.test((v ?? "").trim());

/**
 * Picks the tax mode implied by two GSTINs, or by two state names when the
 * client is an unregistered family — which is most wedding work.
 *
 * Returns null when there is not enough information to decide, so the caller
 * leaves the user's own choice alone instead of overwriting it with a guess.
 */
export function inferTaxMode(args: {
    studioGstin?: string;
    studioState?: string;
    clientGstin?: string;
    clientState?: string;
}): TaxMode | null {
    const studio = checkGstin(args.studioGstin);
    if (!studio.valid && !args.studioState) return null;

    const studioCode =
        studio.stateCode ?? stateByName(args.studioState)?.code ?? DEFAULT_STATE_CODE;

    const client = checkGstin(args.clientGstin);
    const clientCode =
        client.stateCode ?? stateByName(args.clientState)?.code;

    if (!clientCode) return null;

    return studioCode === clientCode ? "intra" : "inter";
}

/* ------------------------------------------------------------------ *
 * Totals
 * ------------------------------------------------------------------ */

export type ChargeType = "amount" | "percentage";

export type LineItemInput = {
    name?: string;
    description?: string;
    sac?: string;
    unit?: string;
    quantity?: unknown;
    rate?: unknown;
    /** Per-line discount, always a percentage of that line's gross. */
    discountPercent?: unknown;
    gstRate?: unknown;
};

export type ComputedLine = {
    name: string;
    description: string;
    sac: string;
    unit: string;
    quantity: number;
    rate: number;
    gross: number;
    discountPercent: number;
    lineDiscount: number;
    /** After the line discount but before any document-level discount. */
    netBeforeGlobal: number;
    /** After the document-level discount has been apportioned onto this line. */
    taxable: number;
    gstRate: number;
    cgst: number;
    sgst: number;
    igst: number;
    tax: number;
    total: number;
};

/** One row of the GST summary table, grouped by rate as the rules require. */
export type GstGroup = {
    gstRate: number;
    taxable: number;
    cgst: number;
    sgst: number;
    igst: number;
    tax: number;
};

export type TotalsInput = {
    items?: LineItemInput[];
    taxMode?: TaxMode;
    /** Document-level discount, apportioned across lines pro rata. */
    discount?: { value?: unknown; type?: ChargeType };
    /** Travel, accommodation and the like. Taxed at `otherChargesGstRate`. */
    otherCharges?: { label?: string; value?: unknown; gstRate?: unknown }[];
    /** Round the grand total to the nearest rupee and show the difference. */
    roundOff?: boolean;
    /** Advance already collected, deducted from the grand total. */
    advanceReceived?: unknown;
};

export type Totals = {
    lines: ComputedLine[];
    /** Sum of quantity × rate, before any discount. */
    gross: number;
    lineDiscountTotal: number;
    documentDiscount: number;
    discountTotal: number;
    /** The value GST is charged on. */
    taxableValue: number;
    groups: GstGroup[];
    cgst: number;
    sgst: number;
    igst: number;
    taxTotal: number;
    otherChargesTotal: number;
    /** Before rounding. */
    netTotal: number;
    roundOff: number;
    grandTotal: number;
    advanceReceived: number;
    balanceDue: number;
    taxMode: TaxMode;
};

const num = (v: unknown, fallback = 0): number => {
    const n = Number(v ?? fallback);
    return Number.isFinite(n) ? n : fallback;
};

/** Splits a tax amount across CGST/SGST or into IGST, per the mode. */
function splitTax(amount: number, mode: TaxMode) {
    if (mode === "exempt") return { cgst: 0, sgst: 0, igst: 0 };
    if (mode === "inter") return { cgst: 0, sgst: 0, igst: toPaiseRounded(amount) };

    // Halve once and derive the other side by subtraction, so the two halves
    // always add back to the whole — rounding each independently can leave a
    // paisa unaccounted for, and a GST return that is off by a paisa is a
    // mismatch notice.
    const half = toPaiseRounded(amount / 2);
    return { cgst: half, sgst: toPaiseRounded(amount - half), igst: 0 };
}

export function computeTotals(input: TotalsInput): Totals {
    const taxMode: TaxMode = input.taxMode ?? "intra";
    const rawItems = input.items ?? [];

    /* Pass 1: line gross, line discount, net. */
    const staged = rawItems.map((item) => {
        const quantity = num(item.quantity);
        const rate = num(item.rate);
        const gross = toPaiseRounded(quantity * rate);

        const discountPercent = Math.min(Math.max(num(item.discountPercent), 0), 100);
        const lineDiscount = toPaiseRounded((gross * discountPercent) / 100);

        return {
            name: item.name ?? "",
            description: item.description ?? "",
            sac: item.sac ?? DEFAULT_SAC_CODE,
            unit: item.unit ?? "",
            quantity,
            rate,
            gross,
            discountPercent,
            lineDiscount,
            netBeforeGlobal: toPaiseRounded(gross - lineDiscount),
            gstRate: taxMode === "exempt" ? 0 : num(item.gstRate, DEFAULT_GST_RATE),
        };
    });

    const gross = toPaiseRounded(staged.reduce((sum, l) => sum + l.gross, 0));
    const lineDiscountTotal = toPaiseRounded(
        staged.reduce((sum, l) => sum + l.lineDiscount, 0)
    );
    const netBeforeGlobal = toPaiseRounded(
        staged.reduce((sum, l) => sum + l.netBeforeGlobal, 0)
    );

    /* Document-level discount, as an absolute amount. */
    const discountType: ChargeType = input.discount?.type ?? "amount";
    const discountValue = Math.max(num(input.discount?.value), 0);
    const documentDiscount = toPaiseRounded(
        discountType === "percentage"
            ? (netBeforeGlobal * Math.min(discountValue, 100)) / 100
            : Math.min(discountValue, netBeforeGlobal)
    );

    /*
     * Pass 2: apportion the document discount across the lines in proportion
     * to their net value.
     *
     * Subtracting it from the grand total instead would be simpler and wrong:
     * GST is charged per rate slab, so a discount that is not carried back
     * onto the taxable value of each slab leaves the summary table's taxable
     * column not adding up to the invoice's taxable value — and overstates the
     * tax actually due.
     *
     * The last line absorbs the rounding remainder so the apportioned parts
     * sum to exactly the discount.
     */
    let discountAllocated = 0;
    const lines: ComputedLine[] = staged.map((line, index) => {
        const isLast = index === staged.length - 1;

        let share: number;
        if (documentDiscount === 0 || netBeforeGlobal === 0) {
            share = 0;
        } else if (isLast) {
            share = toPaiseRounded(documentDiscount - discountAllocated);
        } else {
            share = toPaiseRounded(
                (documentDiscount * line.netBeforeGlobal) / netBeforeGlobal
            );
            discountAllocated = toPaiseRounded(discountAllocated + share);
        }

        const taxable = toPaiseRounded(Math.max(line.netBeforeGlobal - share, 0));
        const taxAmount =
            taxMode === "exempt"
                ? 0
                : toPaiseRounded((taxable * line.gstRate) / 100);
        const { cgst, sgst, igst } = splitTax(taxAmount, taxMode);

        return {
            ...line,
            taxable,
            cgst,
            sgst,
            igst,
            tax: taxAmount,
            total: toPaiseRounded(taxable + taxAmount),
        };
    });

    /* Other charges behave as extra taxable lines but are reported separately. */
    const charges = (input.otherCharges ?? []).filter(
        (c) => num(c.value) !== 0
    );
    const chargeLines = charges.map((c) => {
        const taxable = toPaiseRounded(num(c.value));
        const gstRate = taxMode === "exempt" ? 0 : num(c.gstRate, DEFAULT_GST_RATE);
        const tax = toPaiseRounded((taxable * gstRate) / 100);
        return { taxable, gstRate, tax, ...splitTax(tax, taxMode) };
    });

    const otherChargesTotal = toPaiseRounded(
        chargeLines.reduce((sum, c) => sum + c.taxable, 0)
    );

    /* Group by rate for the summary table. */
    const byRate = new Map<number, GstGroup>();
    const addToGroup = (row: {
        gstRate: number;
        taxable: number;
        cgst: number;
        sgst: number;
        igst: number;
        tax: number;
    }) => {
        const existing =
            byRate.get(row.gstRate) ??
            {
                gstRate: row.gstRate,
                taxable: 0,
                cgst: 0,
                sgst: 0,
                igst: 0,
                tax: 0,
            };

        byRate.set(row.gstRate, {
            gstRate: row.gstRate,
            taxable: toPaiseRounded(existing.taxable + row.taxable),
            cgst: toPaiseRounded(existing.cgst + row.cgst),
            sgst: toPaiseRounded(existing.sgst + row.sgst),
            igst: toPaiseRounded(existing.igst + row.igst),
            tax: toPaiseRounded(existing.tax + row.tax),
        });
    };

    lines.forEach(addToGroup);
    chargeLines.forEach(addToGroup);

    const groups = [...byRate.values()]
        .filter((g) => g.taxable !== 0)
        .sort((a, b) => a.gstRate - b.gstRate);

    const taxableValue = toPaiseRounded(
        groups.reduce((sum, g) => sum + g.taxable, 0)
    );
    const cgst = toPaiseRounded(groups.reduce((sum, g) => sum + g.cgst, 0));
    const sgst = toPaiseRounded(groups.reduce((sum, g) => sum + g.sgst, 0));
    const igst = toPaiseRounded(groups.reduce((sum, g) => sum + g.igst, 0));
    const taxTotal = toPaiseRounded(cgst + sgst + igst);

    const netTotal = toPaiseRounded(taxableValue + taxTotal);
    const rounded = input.roundOff === false ? netTotal : Math.round(netTotal);
    const roundOff = toPaiseRounded(rounded - netTotal);
    const grandTotal = toPaiseRounded(rounded);

    const advanceReceived = Math.max(num(input.advanceReceived), 0);

    return {
        lines,
        gross,
        lineDiscountTotal,
        documentDiscount,
        discountTotal: toPaiseRounded(lineDiscountTotal + documentDiscount),
        taxableValue,
        groups,
        cgst,
        sgst,
        igst,
        taxTotal,
        otherChargesTotal,
        netTotal,
        roundOff,
        grandTotal,
        advanceReceived,
        balanceDue: toPaiseRounded(grandTotal - advanceReceived),
        taxMode,
    };
}
