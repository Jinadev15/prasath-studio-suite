/**
 * Money actually received against an invoice.
 *
 * The quotation app this was forked from had a single `advanceReceived`
 * number. That is fine for a promise and wrong for a record: a wedding is paid
 * in three or four instalments across six months, by different means, and
 * "how much is outstanding" is a question the studio has to answer from the
 * document itself. A list of receipts gives the balance, the status and the
 * audit trail from one source instead of three.
 *
 * No React, no Next.js — read by the form, the templates and the PDF route.
 */

import { toPaiseRounded } from "@/lib/india/currency";
import { daysUntil } from "@/lib/india/dates";

export type PaymentMode = "cash" | "upi" | "bank" | "cheque" | "card";

export const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
    { value: "upi", label: "UPI" },
    { value: "bank", label: "Bank transfer" },
    { value: "cash", label: "Cash" },
    { value: "cheque", label: "Cheque" },
    { value: "card", label: "Card" },
];

export function paymentModeLabel(mode: string | undefined): string {
    return PAYMENT_MODES.find((m) => m.value === mode)?.label ?? "";
}

export type PaymentEntry = {
    date?: string;
    amount?: unknown;
    mode?: string;
    reference?: string;
    note?: string;
};

/** Total received. The only source of the advance figure on the document. */
export function totalReceived(payments: PaymentEntry[] | undefined): number {
    if (!payments?.length) return 0;
    return toPaiseRounded(
        payments.reduce((sum, payment) => {
            const amount = Number(payment?.amount ?? 0);
            return sum + (Number.isFinite(amount) ? amount : 0);
        }, 0)
    );
}

/* ------------------------------------------------------------------ */

export type PaymentStatusId = "paid" | "partly-paid" | "unpaid" | "overdue";

export type PaymentStatus = {
    id: PaymentStatusId;
    label: string;
    /** Hex, for the stamp on the document. Readable in mono print too. */
    color: string;
};

const STATUS: Record<PaymentStatusId, PaymentStatus> = {
    paid: { id: "paid", label: "Paid", color: "#15803D" },
    "partly-paid": { id: "partly-paid", label: "Partly paid", color: "#A16207" },
    unpaid: { id: "unpaid", label: "Unpaid", color: "#4B5563" },
    overdue: { id: "overdue", label: "Overdue", color: "#B91C1C" },
};

/**
 * Where this invoice stands, derived — never stored.
 *
 * A stored status is a second source of truth for something two other fields
 * already determine, and it is wrong the moment a payment is recorded or the
 * due date passes without anyone reopening the document.
 *
 * Settled is a paise-level comparison rather than equality: a round-off of
 * ±0.50 is normal on an Indian invoice and must not leave it reading "Partly
 * paid" forever over half a rupee.
 */
export function paymentStatus(args: {
    grandTotal: number;
    received: number;
    dueDate?: string;
}): PaymentStatus {
    const { grandTotal, received, dueDate } = args;
    const outstanding = toPaiseRounded(grandTotal - received);

    if (grandTotal > 0 && outstanding <= 0.5) return STATUS.paid;

    const days = daysUntil(dueDate);
    if (days !== null && days < 0) return STATUS.overdue;

    return received > 0 ? STATUS["partly-paid"] : STATUS.unpaid;
}

/* ------------------------------------------------------------------ */

/**
 * Payment terms, as the number of days until the invoice falls due.
 *
 * `null` means due on receipt, which is the common case for photography — the
 * balance is collected before the albums are handed over, not thirty days
 * after an email.
 */
export const PAYMENT_TERM_PRESETS: {
    label: string;
    days: number | null;
}[] = [
    { label: "Due on receipt", days: null },
    { label: "Net 7", days: 7 },
    { label: "Net 15", days: 15 },
    { label: "Net 30", days: 30 },
    { label: "Net 45", days: 45 },
];

export function termDays(label: string | undefined): number | null {
    return (
        PAYMENT_TERM_PRESETS.find((preset) => preset.label === label)?.days ??
        null
    );
}
