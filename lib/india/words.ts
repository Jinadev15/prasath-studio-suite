/**
 * Amount in words, Indian numbering system.
 *
 * Upstream used the `number-to-words` package, which is built on the short
 * scale: it renders 1234567 as "one million two hundred thirty-four thousand
 * five hundred sixty-seven". No Indian document is written that way, and
 * "Rupees One Million…" on a tax invoice looks like a mistake to every reader
 * and to anyone auditing it. The Indian scale groups as crore (10⁷), lakh
 * (10⁵), thousand, hundred.
 *
 * The words block on an invoice is not decoration — it is the figure that wins
 * if the numerals are disputed, so this is written to be exact rather than
 * clever, and it is the one module in here with no dependencies at all.
 */

const UNITS = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
];

const TENS = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
];

/** 0–99. */
function twoDigitsToWords(n: number): string {
    if (n < 20) return UNITS[n];
    const tens = TENS[Math.floor(n / 10)];
    const unit = UNITS[n % 10];
    return unit ? `${tens} ${unit}` : tens;
}

/**
 * 0–999, with the British/Indian "and" between the hundreds and the rest:
 * 456 reads "Four Hundred and Fifty Six".
 */
function threeDigitsToWords(n: number): string {
    const hundreds = Math.floor(n / 100);
    const rest = n % 100;

    if (!hundreds) return twoDigitsToWords(rest);
    if (!rest) return `${UNITS[hundreds]} Hundred`;
    return `${UNITS[hundreds]} Hundred and ${twoDigitsToWords(rest)}`;
}

/**
 * A whole number in Indian words, with no currency wording.
 *
 * Magnitudes above 99 crore are expressed as crores — "One Thousand Two
 * Hundred Crore" — rather than reaching for arab and kharab, which are not
 * used in Indian accounting English. The recursion on the crore group is what
 * produces that.
 */
export function indianNumberToWords(value: number): string {
    const n = Math.floor(Math.abs(value));
    if (!Number.isFinite(n)) return "";
    if (n === 0) return "Zero";

    const crore = Math.floor(n / 10_000_000);
    let rest = n % 10_000_000;

    const lakh = Math.floor(rest / 100_000);
    rest %= 100_000;

    const thousand = Math.floor(rest / 1_000);
    const hundreds = rest % 1_000;

    const parts: string[] = [];
    if (crore) parts.push(`${indianNumberToWords(crore)} Crore`);
    if (lakh) parts.push(`${twoDigitsToWords(lakh)} Lakh`);
    if (thousand) parts.push(`${twoDigitsToWords(thousand)} Thousand`);
    if (hundreds) parts.push(threeDigitsToWords(hundreds));

    return parts.join(" ");
}

/**
 * The full words line for a rupee amount.
 *
 *   1234.5   → "Rupees One Thousand Two Hundred and Thirty Four and Paise Fifty Only"
 *   250000   → "Rupees Two Lakh Fifty Thousand Only"
 *
 * Paise are stated as a separate "Paise …" group rather than folded in with an
 * "and", because "… Thirty Four and Fifty Only" is ambiguous about whether the
 * fifty is rupees or paise.
 */
export function amountInWordsINR(value: unknown): string {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) return "";

    // Round to paise first, so 0.005 does not become "Zero … and Paise Zero".
    const totalPaise = Math.round(Math.abs(amount) * 100);
    const rupees = Math.floor(totalPaise / 100);
    const paise = totalPaise % 100;

    const negative = amount < 0 ? "Minus " : "";

    if (!rupees && !paise) return "Rupees Zero Only";

    const rupeeWords = rupees ? `Rupees ${indianNumberToWords(rupees)}` : "";
    const paiseWords = paise ? `Paise ${twoDigitsToWords(paise)}` : "";

    const joined = [rupeeWords, paiseWords].filter(Boolean).join(" and ");
    return `${negative}${joined} Only`;
}
