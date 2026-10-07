// Zod
import z from "zod";

// RHF
import { FieldPath, UseFormReturn } from "react-hook-form";

// Document schemas
import {
    QuotationSchema,
    ItemSchema as QuotationItemSchema,
    EventSchema as QuotationEventSchema,
    PackageTierSchema,
    AddOnSchema,
    MilestoneSchema,
    TimelineSchema,
    OtherChargeSchema,
} from "@/lib/documents/quotation/schema";
import { ClientSchema, StudioSchema } from "@/lib/documents/common";
import {
    InvoiceSchema,
    PaymentSchema,
} from "@/lib/documents/invoice/schema";
import {
    BookingSchema,
    AlbumSchema,
    BookingFunctionSchema,
    CrewSchema,
    PersonSchema,
} from "@/lib/documents/booking/schema";

/**
 * Types for all three document kinds.
 *
 * The three kinds share a studio block and a client block but diverge
 * completely below that — a booking has no line items and an invoice has no
 * package tiers — so there is no common `DocumentType`. Code that works across
 * kinds is generic over the concrete type instead (see `FormOf`), which is why
 * the form provider and the document context take a type parameter rather than
 * a union: a union would force every consumer to narrow before touching a
 * field, for no benefit, since each section only ever handles its own kind.
 */

/* Documents */
export type QuotationType = z.infer<typeof QuotationSchema>;
export type InvoiceType = z.infer<typeof InvoiceSchema>;
export type BookingType = z.infer<typeof BookingSchema>;

/** Anything this app can put on a page and turn into a PDF. */
export type AnyDocument = QuotationType | InvoiceType | BookingType;

/* Blocks shared by all three */
export type StudioBlockType = z.infer<typeof StudioSchema>;
export type ClientBlockType = z.infer<typeof ClientSchema>;

/* Quotation / invoice pieces */
export type ItemType = z.infer<typeof QuotationItemSchema>;
export type EventType = z.infer<typeof QuotationEventSchema>;
export type OtherChargeType = z.infer<typeof OtherChargeSchema>;
export type TimelineType = z.infer<typeof TimelineSchema>;
export type PackageTierType = z.infer<typeof PackageTierSchema>;
export type AddOnType = z.infer<typeof AddOnSchema>;
export type MilestoneType = z.infer<typeof MilestoneSchema>;
export type PaymentType = z.infer<typeof PaymentSchema>;

/* Booking pieces */
export type PersonType = z.infer<typeof PersonSchema>;
export type CrewType = z.infer<typeof CrewSchema>;
export type BookingFunctionType = z.infer<typeof BookingFunctionSchema>;
export type AlbumType = z.infer<typeof AlbumSchema>;

/* Form plumbing, generic over the document being edited */
export type FormOf<T extends AnyDocument> = UseFormReturn<T>;
export type FieldOf<T extends AnyDocument> = FieldPath<T>;

/** Convenience aliases for the quotation section, which is the largest. */
export type FormType = UseFormReturn<QuotationType>;
export type NameType = FieldPath<QuotationType>;

/* Signature */
export type SignatureColor = {
    name: string;
    label: string;
    color: string;
};

export type SignatureFont = {
    name: string;
    variable: string;
};

export enum SignatureTabs {
    DRAW = "draw",
    TYPE = "type",
    UPLOAD = "upload",
}

/* Export */
export enum ExportTypes {
    JSON = "JSON",
    CSV = "CSV",
    XML = "XML",
}
