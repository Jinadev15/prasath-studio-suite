import type { DocumentAdapter } from "@/lib/documents/adapter";
import { computeTotals } from "@/lib/india/gst";
import { formatINR } from "@/lib/india/currency";
import { formatShortDate, validityStatus } from "@/lib/india/dates";
import type { QuotationType } from "@/types";

import { QuotationSchema } from "./schema";
import {
    applyProfileToQuotation,
    emptyQuotation,
    quotationFromProfile,
} from "./defaults";

export const quotationAdapter: DocumentAdapter<QuotationType> = {
    kind: "quotation",
    schema: QuotationSchema,
    empty: emptyQuotation,
    fromProfile: (profile, options) => quotationFromProfile(profile, options),
    applyProfile: (current, profile, options) =>
        applyProfileToQuotation(current, profile, options),
    numberOf: (document) => document.details.quotationNumber,
    titleOf: (document) => document.details.documentTitle || "Quotation",
    summarise: (document) => {
        const totals = computeTotals({
            items: document.details.items,
            taxMode: document.details.taxMode,
            discount: document.details.discount,
            otherCharges: document.details.otherCharges,
            roundOff: document.details.roundOff,
            advanceReceived: document.details.advanceReceived,
        });
        const validity = validityStatus(document.details.validUntil);

        return {
            title: `${document.details.documentTitle || "Quotation"} #${document.details.quotationNumber}`,
            subtitle: [document.client.name, document.details.occasion]
                .filter(Boolean)
                .join(" · "),
            meta: formatShortDate(document.details.quotationDate),
            amount: formatINR(totals.grandTotal),
            badge: validity?.expired ? "Expired" : undefined,
        };
    },
};
