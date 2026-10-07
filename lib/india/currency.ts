/**
 * Rupee formatting.
 *
 * India does not group digits in threes past the thousand: 1234567 is written
 * 12,34,567 ("twelve lakh thirty four thousand five hundred sixty seven"), not
 * 1,234,567. `Intl` with the `en-IN` locale gets this right, and getting it
 * wrong is immediately obvious to every client who reads the document.
 *
 * This module is free of React and of any Next.js import so it can be used by
 * the form, by the PDF templates rendered through `renderToStaticMarkup`, and
 * by the route handlers alike.
 */

/**
 * How the rupee is written in the document.
 *
 * `symbol` is the default and the right answer almost always. The escape
 * hatches exist because the PDF embeds its fonts and makes no network
 * requests: if a studio swaps in a display face whose subset has no U+20B9,
 * the glyph has nowhere to go. `code` and `text` are ASCII and always render.
 */
export type RupeeDisplay = "symbol" | "code" | "text";

export const RUPEE_SIGN = "₹";

const PREFIX: Record<RupeeDisplay, string> = {
    symbol: RUPEE_SIGN,
    code: "INR ",
    text: "Rs. ",
};

export type MoneyOptions = {
    display?: RupeeDisplay;
    /**
     * Drop the paise when they are zero. Quotations read better in whole
     * rupees; a tax invoice keeps them so the arithmetic is checkable.
     */
    trimZeroPaise?: boolean;
};

/** Rounds to paise. Money arithmetic elsewhere in the app goes through this. */
export function toPaiseRounded(value: unknown): number {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100) / 100;
}

/**
 * Formats an amount in Indian digit grouping, with a rupee prefix.
 *
 * Deliberately built from `Intl.NumberFormat` in `decimal` style with an
 * explicit prefix rather than `style: "currency"`. The currency style emits a
 * non-breaking space after the symbol in some ICU builds and none in others,
 * so the same invoice rendered in the browser preview and in the Lambda that
 * prints the PDF could differ by a space — visible when the number is
 * right-aligned in a column.
 */
export function formatINR(value: unknown, options: MoneyOptions = {}): string {
    const { display = "symbol", trimZeroPaise = false } = options;
    const amount = toPaiseRounded(value);

    const fractionDigits =
        trimZeroPaise && Number.isInteger(amount) ? 0 : 2;

    const digits = new Intl.NumberFormat("en-IN", {
        style: "decimal",
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(Math.abs(amount));

    const sign = amount < 0 ? "-" : "";
    return `${sign}${PREFIX[display]}${digits}`;
}

/** Grouped digits with no currency prefix, for table columns with a ₹ header. */
export function formatIndianDigits(value: unknown, fractionDigits = 2): string {
    return new Intl.NumberFormat("en-IN", {
        style: "decimal",
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(toPaiseRounded(value));
}

/**
 * Reads a number out of whatever a user typed into a money field.
 *
 * Accepts "₹1,20,000", "120000.50", "1.2 lakh" and "₹1.5L" — the last two
 * because studios quote in lakhs out loud and type it the same way.
 */
export function parseINR(input: string): number | null {
    if (typeof input !== "string") return null;

    const cleaned = input
        .replace(/[₹,\s]/g, "")
        .replace(/rs\.?/i, "")
        .replace(/inr/i, "")
        .trim();

    if (!cleaned) return null;

    const lakhCrore = cleaned.match(/^(\d*\.?\d+)(l|lakh|lac|cr|crore)$/i);
    if (lakhCrore) {
        const base = Number(lakhCrore[1]);
        const unit = lakhCrore[2].toLowerCase();
        const multiplier = unit.startsWith("c") ? 1e7 : 1e5;
        return Number.isFinite(base) ? toPaiseRounded(base * multiplier) : null;
    }

    const n = Number(cleaned);
    return Number.isFinite(n) ? toPaiseRounded(n) : null;
}

/**
 * A compact form for dashboards and package cards: "₹1.2L", "₹2.5Cr".
 *
 * Not used on the documents themselves — a quotation states the exact figure.
 */
export function formatINRCompact(value: unknown): string {
    const amount = toPaiseRounded(value);
    const abs = Math.abs(amount);

    if (abs >= 1e7) return `${RUPEE_SIGN}${trimTrailingZero(amount / 1e7)}Cr`;
    if (abs >= 1e5) return `${RUPEE_SIGN}${trimTrailingZero(amount / 1e5)}L`;
    if (abs >= 1e3) return `${RUPEE_SIGN}${trimTrailingZero(amount / 1e3)}K`;
    return formatINR(amount, { trimZeroPaise: true });
}

function trimTrailingZero(n: number): string {
    return n.toFixed(2).replace(/\.?0+$/, "");
}
