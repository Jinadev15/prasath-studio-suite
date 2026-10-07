"use client";

import { useFormContext, useWatch } from "react-hook-form";

import {
    DatePickerFormField,
    FormInput,
    SignatureModal,
    Subheading,
    TemplateGallery,
} from "@/app/components";
import { Switch } from "@/components/ui/switch";

import { useTranslationContext } from "@/contexts/TranslationContext";
import { useTotals } from "@/hooks/useTotals";

import { formatINR } from "@/lib/india/currency";
import { amountInWordsINR } from "@/lib/india/words";
import { validityStatus } from "@/lib/india/dates";

import { AlertTriangle } from "lucide-react";

import type { QuotationType } from "@/types";

/**
 * Step 6 — numbering, dates, what the document shows, and the final figures.
 *
 * The section toggles are the point of this step. A quotation for a single
 * birthday shoot does not want a GST summary table, a payment schedule and a
 * delivery timeline; switching those off is better than leaving them half
 * filled, because a section hidden by accident is worse than one switched off
 * on purpose.
 */
const SECTION_TOGGLES = [
    ["events", "form.steps.functions.heading"],
    ["gstBreakup", "quotationDocument.gstSummaryHeading"],
    ["paymentSchedule", "form.steps.terms.paymentSchedule"],
    ["deliveryTimeline", "form.steps.terms.deliveryTimeline"],
    ["inclusions", "form.steps.terms.inclusions"],
    ["exclusions", "form.steps.terms.exclusions"],
    ["terms", "form.steps.terms.terms"],
    ["bankDetails", "quotationDocument.paymentHeading"],
    ["upiQr", "quotationDocument.scanToPay"],
    ["signature", "quotationDocument.signature"],
    ["acceptanceBlock", "quotationDocument.acceptanceHeading"],
    ["tamilLabels", "navbar.language"],
] as const;

const ReviewSection = () => {
    const { control, setValue } = useFormContext<QuotationType>();
    const { _t } = useTranslationContext();
    const totals = useTotals();

    const sections = useWatch({ control, name: "details.sections" });
    const validUntil = useWatch({ control, name: "details.validUntil" });
    const validity = validityStatus(validUntil);

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Subheading>{_t("form.steps.review.heading")}</Subheading>

                <FormInput
                    name="details.documentTitle"
                    label={_t("quotationDocument.quotation")}
                />
                <FormInput
                    name="details.quotationNumber"
                    label={_t("quotationDocument.quotationNumber")}
                />
                <DatePickerFormField
                    name="details.quotationDate"
                    label={_t("quotationDocument.quotationDate")}
                />
                <DatePickerFormField
                    name="details.validUntil"
                    label={_t("quotationDocument.validUntil")}
                />
                {validity?.expired && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {_t("quotationDocument.expired")}
                    </p>
                )}
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

            <div className="flex flex-col gap-3">
                <Subheading>
                    {_t("form.steps.review.signature.heading")}
                </Subheading>
                <SignatureModal />
            </div>

            <div className="flex flex-col gap-3">
                <div>
                    <Subheading>
                        {_t("form.steps.review.sections")}
                    </Subheading>
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
                            {_t("form.steps.review.totals.balance")}
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

export default ReviewSection;
