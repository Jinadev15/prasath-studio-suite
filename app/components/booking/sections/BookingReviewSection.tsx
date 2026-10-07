"use client";

import { useFormContext, useWatch } from "react-hook-form";

import {
    FormInput,
    FormSelect,
    FormTextarea,
    SignatureModal,
    StringListEditor,
    Subheading,
    TemplateGallery,
} from "@/app/components";
import { Switch } from "@/components/ui/switch";

import { useTranslationContext } from "@/contexts/TranslationContext";

import { formatINR } from "@/lib/india/currency";
import { BOOKING_OUTPUTS } from "@/lib/documents/booking/schema";

import { Lock } from "lucide-react";

import type { BookingType } from "@/types";

/**
 * Step 6 — commercials, which sheet to produce, and the fine print.
 *
 * Two things here are worth stating plainly.
 *
 * The output switch decides which of the two PDFs is generated: the family's
 * booking sheet or the crew's call sheet. They are different documents with
 * different audiences, not two styles of the same one.
 *
 * `internalNotes` is the studio talking to itself and never reaches either
 * PDF. It is marked as such in the UI so nobody writes "father is difficult,
 * mother decides" into a field that is about to be printed and handed across
 * a table.
 */
const SECTION_TOGGLES = [
    ["functions", "form.steps.functions.heading"],
    ["coverage", "quotationDocument.coverageHeading"],
    ["preferences", "form.steps.preferences.heading"],
    ["commercials", "quotationDocument.commercialsHeading"],
    ["terms", "form.steps.terms.terms"],
    ["signature", "quotationDocument.signature"],
    ["acceptanceBlock", "quotationDocument.bookingConfirmation"],
    ["tamilLabels", "navbar.language"],
] as const;

const BookingReviewSection = () => {
    const { control, setValue } = useFormContext<BookingType>();
    const { _t } = useTranslationContext();

    const sections = useWatch({ control, name: "details.sections" });
    const commercials = useWatch({ control, name: "details.commercials" });
    const documentType = useWatch({ control, name: "details.documentType" });

    const budgetMin = Number(commercials?.budgetMin ?? 0);
    const budgetMax = Number(commercials?.budgetMax ?? 0);

    return (
        <section className="flex flex-col gap-6">
            {/* Which sheet */}
            <div className="flex flex-col gap-2">
                <Subheading>{_t("form.steps.review.whichSheet")}</Subheading>
                <FormSelect
                    name="details.documentType"
                    label={_t("form.steps.review.documentType")}
                    placeholder="—"
                    options={BOOKING_OUTPUTS.map((value) => ({
                        value,
                        label:
                            value === "crew"
                                ? _t("form.steps.review.crewSheet")
                                : _t("form.steps.review.bookingSheet"),
                    }))}
                />
                {documentType === "crew" && (
                    <p className="flex items-start gap-1.5 rounded-md border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {_t("form.steps.review.crewSheetNote")}
                    </p>
                )}
            </div>

            {/* Commercials */}
            <div className="flex flex-col gap-3">
                <Subheading>
                    {_t("quotationDocument.commercialsHeading")}
                </Subheading>

                <div className="grid gap-3 sm:grid-cols-2">
                    <FormInput
                        vertical
                        name="details.commercials.budgetMin"
                        label={_t("form.steps.commercials.budgetMin")}
                        type="number"
                        min={0}
                        step="any"
                    />
                    <FormInput
                        vertical
                        name="details.commercials.budgetMax"
                        label={_t("form.steps.commercials.budgetMax")}
                        type="number"
                        min={0}
                        step="any"
                    />
                </div>

                {(budgetMin > 0 || budgetMax > 0) && (
                    <p className="text-xs text-muted-foreground">
                        {budgetMin > 0 && budgetMax > 0
                            ? `${formatINR(budgetMin, { trimZeroPaise: true })} – ${formatINR(budgetMax, { trimZeroPaise: true })}`
                            : formatINR(budgetMin || budgetMax, {
                                  trimZeroPaise: true,
                              })}
                    </p>
                )}

                <FormInput
                    name="details.commercials.advanceExpected"
                    label={_t("quotationDocument.advanceExpected")}
                    type="number"
                    min={0}
                    step="any"
                />
                <FormInput
                    name="details.commercials.quotationReference"
                    label={_t("quotationDocument.againstQuotation")}
                    placeholder="QTN/2026-27/001"
                />
            </div>

            {/* Internal only */}
            <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
                <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    <Subheading>
                        {_t("form.steps.commercials.internalNotes")}
                    </Subheading>
                </div>
                <p className="text-xs text-muted-foreground">
                    {_t("form.steps.commercials.internalNotesHint")}
                </p>
                <FormTextarea
                    name="details.commercials.internalNotes"
                    label={_t("form.steps.commercials.internalNotes")}
                />
            </div>

            {/* Consent */}
            <div className="flex flex-col gap-2">
                <label className="flex items-center justify-between gap-3 text-sm">
                    <span>{_t("form.steps.commercials.portfolioConsent")}</span>
                    <Switch
                        checked={Boolean(commercials?.portfolioConsent)}
                        onCheckedChange={(checked) =>
                            setValue(
                                "details.commercials.portfolioConsent",
                                checked,
                                { shouldDirty: true }
                            )
                        }
                    />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm">
                    <span>{_t("form.steps.commercials.termsAccepted")}</span>
                    <Switch
                        checked={Boolean(commercials?.termsAccepted)}
                        onCheckedChange={(checked) =>
                            setValue(
                                "details.commercials.termsAccepted",
                                checked,
                                { shouldDirty: true }
                            )
                        }
                    />
                </label>
            </div>

            {/* Terms */}
            <div className="flex flex-col gap-2">
                <Subheading>{_t("form.steps.terms.terms")}</Subheading>
                <StringListEditor
                    name="details.terms"
                    addLabel={_t("form.steps.terms.addLine")}
                    removeLabel={_t("form.steps.terms.removeLine")}
                />
            </div>

            <div className="flex flex-col gap-2">
                <Subheading>
                    {_t("form.steps.terms.additionalNotes")}
                </Subheading>
                <FormTextarea
                    name="details.additionalNotes"
                    label={_t("form.steps.terms.additionalNotes")}
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
        </section>
    );
};

export default BookingReviewSection;
