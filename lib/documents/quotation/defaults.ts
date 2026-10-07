/**
 * Turning a studio profile into a new quotation.
 *
 * This is the seam that makes the "parent company details are changeable"
 * requirement actually pay off: the profile is edited once in settings, and
 * every new document starts already carrying the logo, the GSTIN, the bank
 * details, the signature, the numbering series, the terms and the remembered
 * rates. The form is then free to be about the client and the shoot.
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
import {
    formatDocumentNumber,
    type StudioProfile,
} from "@/lib/studio/profile";
import { studioBlockFromProfile } from "@/lib/documents/studioBlock";

import type { ItemType, QuotationType } from "@/types";

/**
 * An empty document, used before any profile exists.
 *
 * Deliberately not a demo quotation: a form pre-filled with plausible sample
 * data is one the user has to audit line by line before sending, and the one
 * line they miss is the one that goes out with someone else's phone number on
 * it. The sample data lives behind an explicit "Load example" action instead.
 */
export function emptyQuotation(): QuotationType {
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
            documentTitle: "QUOTATION",
            quotationNumber: "",
            quotationDate: toIsoDate(today),
            validUntil: toIsoDate(addDays(today, 15)),
            referenceNumber: "",
            occasion: "",
            events: [],
            items: [blankItem()],
            taxMode: "intra",
            placeOfSupply: DEFAULT_STATE_NAME,
            discount: { value: 0, type: "amount" },
            otherCharges: [],
            roundOff: true,
            advanceReceived: 0,
            packageTiers: [],
            addOns: [],
            paymentSchedule: [],
            deliveryTimeline: [],
            inclusions: [],
            exclusions: [],
            terms: [],
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
    QuotationType["details"]["sections"]
> {
    return {
        events: true,
        packageTiers: false,
        addOns: false,
        gstBreakup: true,
        paymentSchedule: true,
        deliveryTimeline: true,
        inclusions: true,
        exclusions: true,
        terms: true,
        bankDetails: true,
        upiQr: true,
        signature: true,
        acceptanceBlock: true,
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

export function blankEvent(): QuotationType["details"]["events"][number] {
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
): QuotationType["details"]["events"][number] {
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
export function quotationFromProfile(
    profile: StudioProfile,
    options: { sequence?: number; date?: Date } = {}
): QuotationType {
    const base = emptyQuotation();
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
            quotationNumber: formatDocumentNumber(
                profile.series.quotation,
                date,
                options.sequence ?? profile.series.quotation.nextSequence
            ),
            quotationDate: toIsoDate(date),
            validUntil: toIsoDate(addDays(date, profile.defaultValidityDays)),
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
            paymentSchedule: profile.defaultPaymentSchedule.map((m) => ({
                ...m,
            })),
            deliveryTimeline: DEFAULT_DELIVERY_TIMELINE.map((t) => ({ ...t })),
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
export function applyProfileToQuotation(
    current: QuotationType,
    profile: StudioProfile,
    options: { renumber?: boolean } = {}
): QuotationType {
    const date = current.details.quotationDate
        ? new Date(current.details.quotationDate)
        : new Date();

    return {
        ...current,
        studio: studioBlockFromProfile(profile),
        details: {
            ...current.details,
            quotationNumber: options.renumber
                ? formatDocumentNumber(profile.series.quotation, date)
                : current.details.quotationNumber,
            theme: {
                accentColor: profile.accentColor,
                fontId: profile.fontId as never,
                density: profile.density as never,
            },
            pdfTemplate: profile.templateId,
        },
    };
}
