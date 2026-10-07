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
 * A tier comparison, as three columns the client chooses between.
 *
 * A quotation stating one number invites a negotiation about that number;
 * three tiers side by side turn it into a choice. The totals here are typed
 * rather than computed, because the tiers the client is *not* being sold are
 * round headline figures, not itemised builds.
 */
const PackageTierSchema = z.object({
    name: text(40),
    tagline: text(90),
    amount: nonNegative,
    highlights: z.array(z.string().max(120)).optional().default([]),
    recommended: z.boolean().optional().default(false),
});

const AddOnSchema = z.object({
    name: text(80),
    description: text(200),
    unit: text(20),
    rate: nonNegative,
});

const MilestoneSchema = z.object({
    label: text(60),
    percent: num(z.number().min(0).max(100)),
    due: text(90),
});


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
    packageTiers: z.boolean().optional().default(false),
    addOns: z.boolean().optional().default(false),
    gstBreakup: z.boolean().optional().default(true),
    paymentSchedule: z.boolean().optional().default(true),
    deliveryTimeline: z.boolean().optional().default(true),
    inclusions: z.boolean().optional().default(true),
    exclusions: z.boolean().optional().default(true),
    terms: z.boolean().optional().default(true),
    bankDetails: z.boolean().optional().default(true),
    upiQr: z.boolean().optional().default(true),
    signature: z.boolean().optional().default(true),
    acceptanceBlock: z.boolean().optional().default(true),
    tamilLabels: z.boolean().optional().default(false),
});

/* ------------------------------------------------------------------ *
 * Details
 * ------------------------------------------------------------------ */

const DetailsSchema = z.object({
    documentTitle: z.string().max(40).optional().default("QUOTATION"),
    quotationNumber: text(40),
    quotationDate: optionalIsoDate,
    validUntil: optionalIsoDate,
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
    advanceReceived: nonNegative.optional().default(0),

    packageTiers: z.array(PackageTierSchema).optional().default([]),
    addOns: z.array(AddOnSchema).optional().default([]),
    paymentSchedule: z.array(MilestoneSchema).optional().default([]),
    deliveryTimeline: z.array(TimelineSchema).optional().default([]),

    inclusions: z.array(z.string().max(200)).optional().default([]),
    exclusions: z.array(z.string().max(200)).optional().default([]),
    terms: z.array(z.string().max(300)).optional().default([]),
    additionalNotes: z.string().max(1500).optional().default(""),

    sections: SectionsSchema.optional(),
    theme: ThemeSchema.optional(),
    pdfTemplate: num(z.number().int().min(1), 1),
    updatedAt: text(40),
});

export const QuotationSchema = z.object({
    studio: StudioSchema,
    client: BaseClientSchema,
    details: DetailsSchema,
});

export {
    AddOnSchema,
    EventSchema,
    ItemSchema,
    MilestoneSchema,
    OtherChargeSchema,
    PackageTierSchema,
    SectionsSchema,
    StudioSchema,
    ThemeSchema,
    TimelineSchema,
};
