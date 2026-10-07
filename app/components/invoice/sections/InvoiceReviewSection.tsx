"use client";

import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import {
    DatePickerFormField,
    FormInput,
    FormSelect,
    FormTextarea,
    SignatureModal,
    Subheading,
    TemplateGallery,
} from "@/app/components";
import { Switch } from "@/components/ui/switch";

import { useTranslationContext } from "@/contexts/TranslationContext";
import { useTotals } from "@/hooks/useTotals";

import { formatINR } from "@/lib/india/currency";
import { amountInWordsINR } from "@/lib/india/words";
import { INVOICE_TYPES } from "@/lib/documents/invoice/schema";

import { Info } from "lucide-react";

import type { InvoiceType } from "@/types";

/**
 * Step 6 — document type, numbering, what the invoice shows, and the figures.
 *
 * The document-type choice at the top is the consequential one. A Bill of
 * Supply is what a supplier who cannot charge GST must issue instead of a tax
 * invoice, and it may not show tax at all — so choosing it forces the tax mode
 * to `exempt` rather than trusting the user to go back and blank the right
 * fields.
 */
const SECTION_TOGGLES = [
    ["events", "form.steps.functions.heading"],
    ["gstBreakup", "quotationDocument.gstSummaryHeading"],
    ["paymentHistory", "quotationDocument.paymentsHeading"],
    ["declaration", "quotationDocument.declarationHeading"],
    ["deliveryTimeline", "form.steps.terms.deliveryTimeline"],
    ["inclusions", "form.steps.terms.inclusions"],
    ["exclusions", "form.steps.terms.exclusions"],
    ["terms", "form.steps.terms.terms"],
    ["bankDetails", "quotationDocument.paymentHeading"],
    ["upiQr", "quotationDocument.scanToPay"],
    ["signature", "quotationDocument.signature"],
    ["tamilLabels", "navbar.language"],
] as const;

const InvoiceReviewSection = () => {
    const { control, setValue } = useFormContext<InvoiceType>();
    const { _t } = useTranslationContext();
    const totals = useTotals();

    const sections = useWatch({ control, name: "details.sections" });
    const documentType = useWatch({ control, name: "details.documentType" });
    const taxMode = useWatch({ control, name: "details.taxMode" });

    const typeMeta = INVOICE_TYPES.find((t) => t.value === documentType);
    const untaxed = typeMeta ? !typeMeta.taxed : false;

    /*
     * A Bill of Supply cannot carry tax. Forcing the mode here rather than
     * warning about it means the document is right by construction — the items
     * table drops its SAC and GST columns and the GST summary renders nothing,
     * because they all read `taxMode`.
     */
    useEffect(() => {
        if (untaxed && taxMode !== "exempt") {
            setValue("details.taxMode", "exempt", { shouldDirty: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [untaxed]);

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Subheading>{_t("form.steps.review.heading")}</Subheading>

                <FormSelect
                    name="details.documentType"
                    label={_t("form.steps.review.documentType")}
                    placeholder="—"
                    options={INVOICE_TYPES.map((type) => ({
                        value: type.value,
                        label: type.label,
                    }))}
                />

                {untaxed && (
                    <p className="flex items-start gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/5 p-2.5 text-xs">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        {_t("form.steps.review.billOfSupplyNote")}
                    </p>
                )}

                <FormInput
                    name="details.documentTitle"
                    label={_t("form.steps.review.titleOverride")}
                    placeholder={typeMeta?.label.toUpperCase()}
                />
                <FormInput
                    name="details.invoiceNumber"
                    label={_t("quotationDocument.invoiceNumber")}
                />
                <DatePickerFormField
                    name="details.invoiceDate"
                    label={_t("quotationDocument.invoiceDate")}
                />
                <FormInput
                    name="details.referenceNumber"
                    label={_t("quotationDocument.reference")}
                />
                <FormInput
                    name="details.occasion"
                    label={_t("quotationDocument.occasion")}
                    placeholder="Wedding of Karthik & Divya"
                />
            </div>

            <div className="flex flex-col gap-2">
                <Subheading>
                    {_t("quotationDocument.declarationHeading")}
                </Subheading>
                <FormTextarea
                    name="details.declaration"
                    label={_t("quotationDocument.declarationHeading")}
                />
            </div>

            <div className="flex flex-col gap-3">
                <Subheading>
                    {_t("form.steps.review.signature.heading")}
                </Subheading>
                <SignatureModal />
            </div>

            <div className="flex flex-col gap-3">
                <div>
                    <Subheading>{_t("form.steps.review.sections")}</Subheading>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {_t("form.steps.review.sectionsHint")}
                    </p>
                </div>

                <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    {SECTION_TOGGLES.map(([key, labelKey]) => (
                        <label
                            key={key}
                            className="flex items-center justify-between gap-3 text-sm"
                        >
                            <span className="min-w-0 truncate">
                                {_t(labelKey)}
                            </span>
                            <Switch
                                checked={sections?.[key] !== false}
                                onCheckedChange={(checked) =>
                                    setValue(
                                        `details.sections.${key}`,
                                        checked,
                                        { shouldDirty: true }
                                    )
                                }
                            />
                        </label>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <Subheading>{_t("gallery.appearanceControls")}</Subheading>
                <TemplateGallery />
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-semibold">
                        {_t("form.steps.review.totals.grandTotal")}
                    </span>
                    <span className="text-xl font-bold tabular-nums">
                        {formatINR(totals.grandTotal)}
                    </span>
                </div>

                {totals.advanceReceived > 0 && (
                    <div className="mt-1 flex items-baseline justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">
                            {_t("quotationDocument.amountDue")}
                        </span>
                        <span className="font-semibold tabular-nums text-primary">
                            {formatINR(totals.balanceDue)}
                        </span>
                    </div>
                )}

                <p className="mt-2 border-t pt-2 text-xs italic text-muted-foreground">
                    {_t("form.steps.review.totals.inWords")}:{" "}
                    {amountInWordsINR(
                        totals.advanceReceived > 0
                            ? totals.balanceDue
                            : totals.grandTotal
                    )}
                </p>
            </div>
        </section>
    );
};

export default InvoiceReviewSection;
