import type { DocumentAdapter } from "@/lib/documents/adapter";
import { computeTotals } from "@/lib/india/gst";
import { formatINR } from "@/lib/india/currency";
import { formatShortDate } from "@/lib/india/dates";
import { paymentStatus, totalReceived } from "./payments";
import type { InvoiceType } from "@/types";

import { InvoiceSchema, INVOICE_TYPES } from "./schema";
import {
    applyProfileToInvoice,
    emptyInvoice,
    invoiceFromProfile,
} from "./defaults";

export const invoiceAdapter: DocumentAdapter<InvoiceType> = {
    kind: "invoice",
    schema: InvoiceSchema,
    empty: emptyInvoice,
    fromProfile: (profile, options) => invoiceFromProfile(profile, options),
    applyProfile: (current, profile, options) =>
        applyProfileToInvoice(current, profile, options),
    numberOf: (document) => document.details.invoiceNumber,
    titleOf: (document) =>
        document.details.documentTitle ||
        INVOICE_TYPES.find((t) => t.value === document.details.documentType)
            ?.label ||
        "Invoice",
    summarise: (document) => {
        const received = totalReceived(document.details.payments);
        const totals = computeTotals({
            items: document.details.items,
            taxMode: document.details.taxMode,
            discount: document.details.discount,
            otherCharges: document.details.otherCharges,
            roundOff: document.details.roundOff,
            advanceReceived: received,
        });
        const status = paymentStatus({
            grandTotal: totals.grandTotal,
            received,
            dueDate: document.details.dueDate,
        });

        return {
            title: `Invoice #${document.details.invoiceNumber}`,
            subtitle: [document.client.name, document.details.occasion]
                .filter(Boolean)
                .join(" · "),
            meta: formatShortDate(document.details.invoiceDate),
            amount: formatINR(totals.grandTotal),
            badge: status.label,
        };
    },
};
