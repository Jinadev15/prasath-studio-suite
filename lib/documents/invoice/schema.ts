import { z } from "zod";

import {
    num,
    ClientSchema as BaseClientSchema,
    EventSchema,
    ItemSchema,
    OtherChargeSchema,
    TimelineSchema,
    StudioSchema,
    ThemeSchema,
    nonNegative,
    optionalIsoDate,
    text,
} from "@/lib/documents/common";

/* ------------------------------------------------------------------ *
 * Functions — the event schedule
 * ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ *
 * Line items
 * ------------------------------------------------------------------ */



/* ------------------------------------------------------------------ *
 * Optional sections
 * ------------------------------------------------------------------ */

/**
 * A payment actually received.
 *
 * This is what makes the document an invoice rather than a quotation: a
 * quotation promises a schedule of future milestones, an invoice records money
 * that has arrived. The balance is derived from this list, never typed, so the
 * figure on the document and the figures in the ledger cannot drift apart.
 */
const PaymentSchema = z.object({
    date: optionalIsoDate,
    amount: nonNegative,
    mode: z
        .enum(["cash", "upi", "bank", "cheque", "card"])
        .optional()
        .default("upi"),
    /** UTR, cheque number, or the last four of a card. */
    reference: text(40),
    note: text(120),
});


/* ------------------------------------------------------------------ *
 * Document type
 * ------------------------------------------------------------------ */

/**
 * What kind of document this is.
 *
 * Not cosmetic. A BILL OF SUPPLY is what a supplier who cannot charge GST —
 * unregistered, or under the composition scheme — must issue instead of a tax
 * invoice, and it may not show tax columns at all. Carrying the distinction in
 * the data rather than leaving it to the user to blank the right fields is
 * what stops a studio issuing a document that is wrong in law.
 */
export const INVOICE_TYPES = [
    { value: "tax-invoice", label: "Tax Invoice", taxed: true },
    { value: "proforma", label: "Proforma Invoice", taxed: true },
    { value: "bill-of-supply", label: "Bill of Supply", taxed: false },
    { value: "receipt", label: "Receipt", taxed: true },
] as const;

export type InvoiceTypeId = (typeof INVOICE_TYPES)[number]["value"];

/* ------------------------------------------------------------------ *
 * Presentation
 * ------------------------------------------------------------------ */


/**
 * Which optional blocks the document renders.
 *
 * Toggles rather than "leave it blank to hide it": a studio that wants no GST
 * breakup on a quotation should not have to delete its tax settings to get
 * there, and a half-filled section hidden by accident is worse than one
 * switched off on purpose.
 */
const SectionsSchema = z.object({
    events: z.boolean().optional().default(true),
    gstBreakup: z.boolean().optional().default(true),
    paymentHistory: z.boolean().optional().default(true),
    deliveryTimeline: z.boolean().optional().default(false),
    inclusions: z.boolean().optional().default(false),
    exclusions: z.boolean().optional().default(false),
    terms: z.boolean().optional().default(true),
    declaration: z.boolean().optional().default(true),
    bankDetails: z.boolean().optional().default(true),
    upiQr: z.boolean().optional().default(true),
    signature: z.boolean().optional().default(true),
    tamilLabels: z.boolean().optional().default(false),
});

/* ------------------------------------------------------------------ *
 * Details
 * ------------------------------------------------------------------ */

const DetailsSchema = z.object({
    documentType: z
        .enum(["tax-invoice", "proforma", "bill-of-supply", "receipt"])
        .optional()
        .default("tax-invoice"),
    /** Overrides the type's own label, for a studio with its own wording. */
    documentTitle: z.string().max(40).optional().default(""),
    invoiceNumber: text(40),
    invoiceDate: optionalIsoDate,
    dueDate: optionalIsoDate,
    paymentTerms: text(40),
    /** The quotation this invoice bills against, if there was one. */
    againstQuotation: text(40),
    referenceNumber: text(40),
    /** "Wedding of Karthik & Divya" — the headline on the document. */
    occasion: text(120),

    events: z.array(EventSchema).optional().default([]),
    items: z.array(ItemSchema).optional().default([]),

    taxMode: z.enum(["intra", "inter", "exempt"]).optional().default("intra"),
    placeOfSupply: text(50),
    discount: z
        .object({
            value: nonNegative.optional().default(0),
            type: z.enum(["amount", "percentage"]).optional().default("amount"),
        })
        .optional(),
    otherCharges: z.array(OtherChargeSchema).optional().default([]),
    roundOff: z.boolean().optional().default(true),
    /**
     * GST payable by the recipient rather than the supplier. A required
     * declaration on an Indian tax invoice even when the answer is no.
     */
    reverseCharge: z.boolean().optional().default(false),

    payments: z.array(PaymentSchema).optional().default([]),
    deliveryTimeline: z.array(TimelineSchema).optional().default([]),

    inclusions: z.array(z.string().max(200)).optional().default([]),
    exclusions: z.array(z.string().max(200)).optional().default([]),
    terms: z.array(z.string().max(300)).optional().default([]),
    declaration: z.string().max(600).optional().default(""),
    additionalNotes: z.string().max(1500).optional().default(""),

    sections: SectionsSchema.optional(),
    theme: ThemeSchema.optional(),
    pdfTemplate: num(z.number().int().min(1), 1),
    updatedAt: text(40),
});

export const InvoiceSchema = z.object({
    studio: StudioSchema,
    client: BaseClientSchema,
    details: DetailsSchema,
});

export {
    EventSchema,
    ItemSchema,
    OtherChargeSchema,
    PaymentSchema,
    SectionsSchema,
    StudioSchema,
    ThemeSchema,
    TimelineSchema,
};
