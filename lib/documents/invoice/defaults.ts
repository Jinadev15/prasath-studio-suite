/**
 * Turning a studio profile into a new invoice.
 *
 * This is the seam that makes the "parent company details are changeable"
 * requirement actually pay off: the profile is edited once in settings, and
 * every new document starts already carrying the logo, the GSTIN, the bank
 * details, the signature, the numbering series, the terms and the remembered
 * rates. The form is then free to be about the client and the job.
 */

import { addDays, toIsoDate } from "@/lib/india/dates";
import { DEFAULT_GST_RATE, DEFAULT_SAC_CODE, type TaxMode } from "@/lib/india/gst";
import { DEFAULT_STATE_NAME } from "@/lib/india/states";
import {
    DEFAULT_DELIVERY_TIMELINE,
    FUNCTION_TYPES,
    serviceById,
    type PackagePreset,
} from "@/lib/photography/catalogue";
import { termDays } from "@/lib/documents/invoice/payments";
import {
    formatDocumentNumber,
    type StudioProfile,
} from "@/lib/studio/profile";
import { studioBlockFromProfile } from "@/lib/documents/studioBlock";

import type { ItemType, InvoiceType } from "@/types";

/**
 * An empty document, used before any profile exists.
 *
 * Deliberately not a demo quotation: a form pre-filled with plausible sample
 * data is one the user has to audit line by line before sending, and the one
 * line they miss is the one that goes out with someone else's phone number on
 * it. The sample data lives behind an explicit "Load example" action instead.
 */
export function emptyInvoice(): InvoiceType {
    const today = new Date();

    return {
        studio: {
            profileId: "",
            brandName: "",
            legalName: "",
            tagline: "",
            logo: "",
            phone: "",
            altPhone: "",
            whatsapp: "",
            email: "",
            website: "",
            instagram: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            district: "",
            state: DEFAULT_STATE_NAME,
            stateCode: "33",
            pincode: "",
            gstin: "",
            pan: "",
            unregisteredNote: "",
            bank: {
                accountName: "",
                accountNumber: "",
                ifsc: "",
                bankName: "",
                branch: "",
            },
            upiId: "",
            upiQr: "",
            signature: "",
            signatureFontFamily: "",
            signatoryName: "",
            signatoryDesignation: "",
            seal: "",
        },
        client: {
            name: "",
            contactPerson: "",
            relationship: "",
            phone: "",
            altPhone: "",
            whatsapp: "",
            email: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            district: "",
            state: DEFAULT_STATE_NAME,
            pincode: "",
            gstin: "",
            customInputs: [],
        },
        details: {
            documentType: "tax-invoice",
            documentTitle: "",
            invoiceNumber: "",
            invoiceDate: toIsoDate(today),
            dueDate: "",
            paymentTerms: "Due on receipt",
            againstQuotation: "",
            referenceNumber: "",
            occasion: "",
            events: [],
            items: [blankItem()],
            taxMode: "intra",
            placeOfSupply: DEFAULT_STATE_NAME,
            discount: { value: 0, type: "amount" },
            otherCharges: [],
            roundOff: true,
            reverseCharge: false,
            payments: [],
            deliveryTimeline: [],
            inclusions: [],
            exclusions: [],
            terms: [],
            declaration: "",
            additionalNotes: "",
            sections: defaultSections(),
            theme: {
                accentColor: "#1F2937",
                fontId: "outfit",
                density: "comfortable",
            },
            pdfTemplate: 1,
            updatedAt: "",
        },
    };
}

export function defaultSections(): NonNullable<
    InvoiceType["details"]["sections"]
> {
    return {
        events: true,
        gstBreakup: true,
        paymentHistory: true,
        // Off by default: an invoice is a demand for payment, and a delivery
        // timeline or a list of inclusions belongs on the quotation that
        // preceded it. A studio that wants them can switch them on.
        deliveryTimeline: false,
        inclusions: false,
        exclusions: false,
        terms: true,
        declaration: true,
        bankDetails: true,
        upiQr: true,
        signature: true,
        tamilLabels: false,
    };
}

export function blankItem(): ItemType {
    return {
        serviceId: "",
        name: "",
        description: "",
        sac: DEFAULT_SAC_CODE,
        unit: "",
        quantity: 1,
        rate: 0,
        discountPercent: 0,
        gstRate: DEFAULT_GST_RATE,
    };
}

export function blankEvent(): InvoiceType["details"]["events"][number] {
    return {
        functionId: "",
        label: "",
        date: "",
        startTime: "",
        endTime: "",
        venue: "",
        venueAddress: "",
        city: "",
        guestCount: 0,
        crew: "",
        notes: "",
    };
}

/** The due date a payment-term preset implies, or "" for due on receipt. */
export function dueDateFor(terms: string | undefined, from: Date): string {
    const days = termDays(terms);
    return days === null ? "" : toIsoDate(addDays(from, days));
}

/** A catalogue service as a line item, priced from the profile's rate memory. */
export function itemFromService(
    serviceId: string,
    profile?: StudioProfile | null
): ItemType {
    const service = serviceById(serviceId);
    if (!service) return blankItem();

    return {
        serviceId: service.id,
        name: service.name,
        description: service.description,
        sac: service.sac,
        unit: service.unit,
        quantity: service.defaultQuantity,
        rate: profile?.rates?.[service.id] ?? 0,
        discountPercent: 0,
        gstRate: service.gstRate,
    };
}

/** An event row prefilled from a function type. */
export function eventFromFunction(
    functionId: string
): InvoiceType["details"]["events"][number] {
    const fn = FUNCTION_TYPES.find((f) => f.id === functionId);
    return {
        ...blankEvent(),
        functionId,
        label: fn?.label ?? "",
    };
}

/** Every line item a package preset implies, priced from rate memory. */
export function itemsFromPackage(
    preset: PackagePreset,
    profile?: StudioProfile | null
): ItemType[] {
    return preset.includes.map(({ serviceId, quantity }) => ({
        ...itemFromService(serviceId, profile),
        quantity,
    }));
}


/**
 * A fresh quotation for a given profile.
 *
 * `sequence` is passed in rather than read here so the caller can show the
 * number it is about to use and still let the user override it — the series is
 * only advanced once a document is actually issued.
 */
export function invoiceFromProfile(
    profile: StudioProfile,
    options: { sequence?: number; date?: Date } = {}
): InvoiceType {
    const base = emptyInvoice();
    const date = options.date ?? new Date();
    const taxMode: TaxMode = profile.defaultTaxMode;

    return {
        ...base,
        studio: studioBlockFromProfile(profile),
        client: {
            ...base.client,
            state: profile.state || DEFAULT_STATE_NAME,
        },
        details: {
            ...base.details,
            invoiceNumber: formatDocumentNumber(
                profile.series.invoice,
                date,
                options.sequence ?? profile.series.invoice.nextSequence
            ),
            invoiceDate: toIsoDate(date),
            /*
             * "Due on receipt" carries no date, which is the normal case for
             * photography — the balance is collected before the albums are
             * handed over, not thirty days after an email.
             */
            dueDate: dueDateFor(profile.defaultPaymentTerms, date),
            paymentTerms: profile.defaultPaymentTerms,
            taxMode,
            placeOfSupply: profile.state || DEFAULT_STATE_NAME,
            items: [
                {
                    ...blankItem(),
                    sac: profile.defaultSac,
                    gstRate:
                        taxMode === "exempt" ? 0 : profile.defaultGstRate,
                },
            ],
            deliveryTimeline: DEFAULT_DELIVERY_TIMELINE.map((t) => ({ ...t })),
            declaration: profile.defaultDeclaration,
            inclusions: [...profile.defaultInclusions],
            exclusions: [...profile.defaultExclusions],
            terms: [...profile.defaultTerms],
            additionalNotes: profile.defaultNotes,
            theme: {
                accentColor: profile.accentColor,
                fontId: profile.fontId as never,
                density: profile.density as never,
            },
            pdfTemplate: profile.templateId,
        },
    };
}

/**
 * Reapplies a profile onto an open quotation without disturbing the shoot.
 *
 * Used when the user switches profile mid-edit, which happens when a studio
 * trades under two names and starts the quotation on the wrong one. Only the
 * studio identity, the numbering and the presentation defaults move; the
 * client, the functions and the line items stay exactly as typed.
 */
export function applyProfileToInvoice(
    current: InvoiceType,
    profile: StudioProfile,
    options: { renumber?: boolean } = {}
): InvoiceType {
    const date = current.details.invoiceDate
        ? new Date(current.details.invoiceDate)
        : new Date();

    return {
        ...current,
        studio: studioBlockFromProfile(profile),
        details: {
            ...current.details,
            invoiceNumber: options.renumber
                ? formatDocumentNumber(profile.series.invoice, date)
                : current.details.invoiceNumber,
            theme: {
                accentColor: profile.accentColor,
                fontId: profile.fontId as never,
                density: profile.density as never,
            },
            pdfTemplate: profile.templateId,
        },
    };
}
