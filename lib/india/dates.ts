/**
 * Date display for Indian documents.
 *
 * Dates are stored as ISO `YYYY-MM-DD` (see lib/schemas.ts) and formatted only
 * at render. Everything here parses that form explicitly rather than handing it
 * to `new Date()`: the Date constructor treats a bare `YYYY-MM-DD` as UTC
 * midnight, so east of Greenwich — all of India — it comes back as the previous
 * day. A quotation dated one day earlier than it was issued is the kind of
 * error nobody notices until a client points at it.
 */

import { DATE_OPTIONS, SHORT_DATE_OPTIONS } from "@/lib/variables";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses the stored form into a *local* date, or null. */
export function parseIsoDate(value: unknown): Date | null {
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }
    if (typeof value !== "string") return null;

    const match = value.trim().match(ISO_DATE);
    if (match) {
        const [, year, month, day] = match;
        // Local midnight, not UTC.
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        return Number.isNaN(date.getTime()) ? null : date;
    }

    // Tolerate anything else parseable, for documents imported from elsewhere.
    const loose = new Date(value);
    return Number.isNaN(loose.getTime()) ? null : loose;
}

export function toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/** "15 January 2026". Falls back to an em dash so a blank field shows nothing odd. */
export function formatLongDate(
    value: unknown,
    locale = "en-IN",
    fallback = "—"
): string {
    const date = parseIsoDate(value);
    if (!date) return fallback;
    try {
        return date.toLocaleDateString(locale, DATE_OPTIONS);
    } catch {
        return date.toLocaleDateString("en-IN", DATE_OPTIONS);
    }
}

/** "15 Jan 2026". For dense tables like the event schedule. */
export function formatShortDate(
    value: unknown,
    locale = "en-IN",
    fallback = "—"
): string {
    const date = parseIsoDate(value);
    if (!date) return fallback;
    try {
        return date.toLocaleDateString(locale, SHORT_DATE_OPTIONS);
    } catch {
        return date.toLocaleDateString("en-IN", SHORT_DATE_OPTIONS);
    }
}

/** "15/01/2026" — the numeric form, day first. */
export function formatNumericDate(value: unknown, fallback = "—"): string {
    const date = parseIsoDate(value);
    if (!date) return fallback;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
}

/** The weekday, which is what a family actually plans around. */
export function formatWeekday(
    value: unknown,
    locale = "en-IN",
    fallback = ""
): string {
    const date = parseIsoDate(value);
    if (!date) return fallback;
    try {
        return date.toLocaleDateString(locale, { weekday: "long" });
    } catch {
        return date.toLocaleDateString("en-IN", { weekday: "long" });
    }
}

export function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

/**
 * Whole days from today until `value`. Negative once it has passed.
 *
 * Both sides are flattened to local midnight first, so "expires tomorrow" does
 * not flip to "expires today" at 6pm purely because of the clock time.
 */
export function daysUntil(value: unknown): number | null {
    const target = parseIsoDate(value);
    if (!target) return null;

    const startOfDay = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

    const MS_PER_DAY = 86_400_000;
    return Math.round((startOfDay(target) - startOfDay(new Date())) / MS_PER_DAY);
}

/** Validity wording for the quotation header: expired, today, or N days left. */
export function validityStatus(validUntil: unknown): {
    label: string;
    expired: boolean;
} | null {
    const days = daysUntil(validUntil);
    if (days === null) return null;

    if (days < 0) return { label: "Expired", expired: true };
    if (days === 0) return { label: "Valid today only", expired: false };
    if (days === 1) return { label: "Valid for 1 more day", expired: false };
    return { label: `Valid for ${days} more days`, expired: false };
}

/**
 * Formats a 24-hour "HH:MM" as "6:30 PM".
 *
 * Call times are entered on a 24-hour input because that is unambiguous to
 * type, and printed in 12-hour because that is how the crew and the family
 * will read them.
 */
export function formatTime(value: unknown, fallback = ""): string {
    if (typeof value !== "string") return fallback;

    const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return value.trim() || fallback;

    const hours = Number(match[1]);
    const minutes = match[2];
    if (hours > 23 || Number(minutes) > 59) return fallback;

    const period = hours < 12 ? "AM" : "PM";
    const display = hours % 12 === 0 ? 12 : hours % 12;
    return `${display}:${minutes} ${period}`;
}

/** "6:30 PM – 11:00 PM", or just the start when there is no end. */
export function formatTimeRange(start: unknown, end: unknown): string {
    const from = formatTime(start);
    const to = formatTime(end);
    if (from && to) return `${from} – ${to}`;
    return from || to || "";
}
