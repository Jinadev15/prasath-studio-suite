import type { WizardStepDef } from "@/lib/wizardSteps";

/**
 * The invoice wizard's steps.
 *
 * The first four are the same as the quotation's and share their components —
 * who is billing, who is billed, which functions were covered, and what they
 * cost. The fifth is where the two diverge: a quotation promises a schedule of
 * payments still to come, an invoice records the money that has arrived.
 */
export const INVOICE_STEPS: WizardStepDef[] = [
    {
        id: 0,
        slug: "studio",
        labelKey: "studio",
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
        // An invoice for an album reprint covers no functions at all, so this
        // step is never "incomplete" — it is simply empty.
        requiredFields: [],
        errorPaths: ["details.events"],
    },
    {
        id: 3,
        slug: "services",
        labelKey: "services",
        requiredFields: [],
        errorPaths: ["details.items", "details.otherCharges"],
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
        slug: "payments",
        labelKey: "payments",
        requiredFields: [],
        errorPaths: ["details.payments", "details.dueDate"],
        /*
         * An unpaid invoice is a perfectly normal invoice, so "complete" here
         * means the terms have been set, not that money has arrived.
         */
        watchFields: ["details.paymentTerms"],
        completeWhen: (values) =>
            String(values["details.paymentTerms"] ?? "").trim().length > 0,
    },
    {
        id: 5,
        slug: "review",
        labelKey: "review",
        requiredFields: ["details.invoiceNumber", "details.invoiceDate"],
        errorPaths: [
            "details.invoiceNumber",
            "details.invoiceDate",
            "details.documentType",
            "details.discount",
        ],
    },
];
