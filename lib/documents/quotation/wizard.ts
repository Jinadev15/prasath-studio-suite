import type { WizardStepDef } from "@/lib/wizardSteps";

/**
 * The quotation wizard's steps.
 *
 * Lives beside the quotation's schema rather than in a global module, because
 * each section now has its own: an invoice has a payments step where a
 * quotation has terms, and a booking has six steps that share only the first
 * two. The shared helpers in `lib/wizardSteps.ts` take a step list as an
 * argument instead of reaching for a global one.
 */
export const QUOTATION_STEPS: WizardStepDef[] = [
    {
        id: 0,
        slug: "studio",
        labelKey: "studio",
        // Only the fields that actually have to be on a document a client
        // reads. The rest of the studio profile is optional by design — a
        // studio below the GST threshold has no GSTIN to enter.
        // Name and phone only. The address prints when it is there and is
        // skipped when it is not, so demanding it would leave this step
        // permanently amber for a studio that works out of a phone number.
        requiredFields: ["studio.brandName", "studio.phone"],
        errorPaths: ["studio"],
    },
    {
        id: 1,
        slug: "client",
        labelKey: "client",
        requiredFields: ["client.name", "client.phone"],
        errorPaths: ["client"],
    },
    {
        id: 2,
        slug: "functions",
        labelKey: "functions",
        // A quotation for a studio album reprint has no functions at all, so
        // this step is never "incomplete" — it is just empty.
        requiredFields: [],
        errorPaths: ["details.events"],
    },
    {
        id: 3,
        slug: "services",
        labelKey: "services",
        requiredFields: [],
        errorPaths: ["details.items", "details.otherCharges"],
        // Completeness depends on every row having a name, a quantity and a
        // rate, which no flat list of paths can express.
        watchFields: ["details.items"],
        completeWhen: (values) => {
            // "Started" is enough: a line needs a name or a price, not both.
            // Nothing here blocks the PDF — this only drives the progress dots.
            const items = values["details.items"];
            return (
                Array.isArray(items) &&
                items.some(
                    (item: Record<string, unknown>) =>
                        String(item?.name ?? "").trim().length > 0 ||
                        Number(item?.rate) > 0
                )
            );
        },
    },
    {
        id: 4,
        slug: "terms",
        labelKey: "terms",
        requiredFields: [],
        errorPaths: [
            "details.paymentSchedule",
            "details.deliveryTimeline",
            "details.terms",
            "details.packageTiers",
            "details.addOns",
        ],
    },
    {
        id: 5,
        slug: "review",
        labelKey: "review",
        requiredFields: ["details.quotationNumber", "details.quotationDate"],
        errorPaths: [
            "details.quotationNumber",
            "details.quotationDate",
            "details.validUntil",
            "details.advanceReceived",
            "details.discount",
        ],
    },
];
