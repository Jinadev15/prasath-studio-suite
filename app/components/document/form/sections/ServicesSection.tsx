"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import {
    BaseButton,
    FormInput,
    FormSelect,
    ServiceCataloguePicker,
    SingleItem,
    Subheading,
} from "@/app/components";
import { Switch } from "@/components/ui/switch";

import { useTranslationContext } from "@/contexts/TranslationContext";
import { useStudioProfiles } from "@/contexts/StudioProfileContext";
import { useTotals } from "@/hooks/useTotals";

import { formatINR } from "@/lib/india/currency";
import { amountInWordsINR } from "@/lib/india/words";
import { GST_RATES, TAX_MODES } from "@/lib/india/gst";
import { INDIAN_STATES } from "@/lib/india/states";
import { PACKAGE_PRESETS } from "@/lib/photography/catalogue";
import {
    blankItem,
    itemFromService,
    itemsFromPackage,
} from "@/lib/documents/quotation/defaults";

import { Plus, Trash2 } from "lucide-react";

import type { QuotationType } from "@/types";

/**
 * Step 4 — what is being sold, and for how much.
 *
 * The totals panel at the foot is the same `computeTotals` the PDF renders
 * from, so what the user checks here is what the client receives. Upstream had
 * the form compute its own subtotal and write it into the document, and the
 * template compute it again — which is how a preview comes to disagree with
 * the PDF.
 */
const ServicesSection = () => {
    const { control, setValue, getValues } = useFormContext<QuotationType>();
    const { _t } = useTranslationContext();
    const { activeProfile } = useStudioProfiles();
    const totals = useTotals();

    const items = useFieldArray({ control, name: "details.items" });
    const charges = useFieldArray({ control, name: "details.otherCharges" });

    const taxMode = useWatch({ control, name: "details.taxMode" });
    const discountType = useWatch({ control, name: "details.discount.type" });
    const roundOff = useWatch({ control, name: "details.roundOff" });

    const addFromCatalogue = (serviceIds: string[]) => {
        const additions = serviceIds.map((id) =>
            itemFromService(id, activeProfile)
        );

        /*
         * A single untouched blank row is the form's starting state, not
         * something the user typed — replace it rather than leaving an empty
         * line above the services they just picked.
         */
        const current = getValues("details.items");
        const onlyBlank =
            current.length === 1 &&
            !current[0]?.name?.trim() &&
            !Number(current[0]?.rate);

        if (onlyBlank) {
            items.replace(additions);
        } else {
            items.append(additions);
        }
    };

    const applyPackage = (presetId: string) => {
        const preset = PACKAGE_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;
        items.replace(itemsFromPackage(preset, activeProfile));
    };

    return (
        <section className="flex flex-col gap-5">
            {/* How GST is treated on this document. */}
            <div className="flex flex-col gap-3">
                <Subheading>{_t("form.steps.services.taxMode")}</Subheading>
                <FormSelect
                    name="details.taxMode"
                    label={_t("form.steps.services.taxMode")}
                    placeholder="—"
                    options={TAX_MODES.map((mode) => ({
                        value: mode.value,
                        label: mode.label,
                        hint: mode.hint,
                    }))}
                />
                {taxMode !== "exempt" && (
                    <FormSelect
                        name="details.placeOfSupply"
                        label={_t("form.steps.services.placeOfSupply")}
                        placeholder="—"
                        options={INDIAN_STATES.map((state) => ({
                            value: state.name,
                            label: state.name,
                        }))}
                    />
                )}
            </div>

            {/* Line items. */}
            <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Subheading>
                        {_t("form.steps.services.heading")}
                    </Subheading>
                    <ServiceCataloguePicker
                        profile={activeProfile}
                        onAddServices={addFromCatalogue}
                        onApplyPackage={applyPackage}
                    />
                </div>

                {items.fields.map((field, index) => (
                    <SingleItem
                        key={field.id}
                        index={index}
                        canRemove={items.fields.length > 1}
                        onRemove={items.remove}
                    />
                ))}

                <BaseButton
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => items.append(blankItem())}
                >
                    <Plus className="h-4 w-4" />
                    {_t("form.steps.services.addItem")}
                </BaseButton>
            </div>

            {/* Travel and other charges, reported separately on the document. */}
            <div className="flex flex-col gap-3">
                <Subheading>
                    {_t("form.steps.services.otherCharges")}
                </Subheading>

                {charges.fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="grid items-end gap-2 sm:grid-cols-[1fr_8rem_6rem_auto]"
                    >
                        <FormInput
                            vertical
                            name={`details.otherCharges.${index}.label`}
                            label={_t("form.steps.services.chargeLabel")}
                        />
                        <FormInput
                            vertical
                            name={`details.otherCharges.${index}.value`}
                            label={_t("form.steps.services.chargeValue")}
                            type="number"
                            min={0}
                            step="any"
                        />
                        {taxMode !== "exempt" ? (
                            <FormSelect
                                vertical
                                numeric
                                name={`details.otherCharges.${index}.gstRate`}
                                label={_t("form.steps.services.gst")}
                                placeholder="—"
                                options={GST_RATES.map((rate) => ({
                                    value: String(rate),
                                    label: `${rate}%`,
                                }))}
                            />
                        ) : (
                            <span />
                        )}
                        <BaseButton
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => charges.remove(index)}
                            tooltipLabel={_t(
                                "form.steps.services.removeCharge"
                            )}
                        >
                            <Trash2 className="h-4 w-4" />
                        </BaseButton>
                    </div>
                ))}

                <BaseButton
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() =>
                        charges.append({
                            label: "",
                            value: 0,
                            gstRate: activeProfile?.defaultGstRate ?? 18,
                        })
                    }
                >
                    <Plus className="h-4 w-4" />
                    {_t("form.steps.services.addCharge")}
                </BaseButton>
            </div>

            {/* Overall discount and rounding. */}
            <div className="flex flex-col gap-3">
                <Subheading>
                    {_t("form.steps.services.discountHeading")}
                </Subheading>
                <div className="grid gap-2 sm:grid-cols-2">
                    <FormInput
                        vertical
                        name="details.discount.value"
                        label={_t("form.steps.services.discountValue")}
                        type="number"
                        min={0}
                        step="any"
                    />
                    <FormSelect
                        vertical
                        name="details.discount.type"
                        label=" "
                        placeholder="—"
                        options={[
                            { value: "amount", label: "₹ amount" },
                            { value: "percentage", label: "% percentage" },
                        ]}
                    />
                </div>
                {discountType === "percentage" && (
                    <p className="text-xs text-muted-foreground">
                        A percentage discount is apportioned across the lines,
                        so each GST slab&apos;s taxable value drops in
                        proportion — which is what the rules require.
                    </p>
                )}

                <label className="flex items-center justify-between gap-3 text-sm">
                    <span>{_t("form.steps.services.roundOff")}</span>
                    <Switch
                        checked={roundOff !== false}
                        onCheckedChange={(checked) =>
                            setValue("details.roundOff", checked, {
                                shouldDirty: true,
                            })
                        }
                    />
                </label>

            </div>

            {/* The figures, from the same engine the PDF uses. */}
            <div className="rounded-lg border bg-muted/30 p-4">
                <Subheading className="mb-2">
                    {_t("form.steps.review.heading")}
                </Subheading>

                <dl className="space-y-1 text-sm">
                    {totals.discountTotal > 0 && (
                        <Row
                            label={_t("form.steps.review.totals.gross")}
                            value={formatINR(totals.gross)}
                        />
                    )}
                    {totals.lineDiscountTotal > 0 && (
                        <Row
                            label={_t("form.steps.review.totals.lineDiscount")}
                            value={`- ${formatINR(totals.lineDiscountTotal)}`}
                        />
                    )}
                    {totals.documentDiscount > 0 && (
                        <Row
                            label={_t(
                                "form.steps.review.totals.documentDiscount"
                            )}
                            value={`- ${formatINR(totals.documentDiscount)}`}
                        />
                    )}
                    {totals.otherChargesTotal > 0 && (
                        <Row
                            label={_t("form.steps.review.totals.otherCharges")}
                            value={formatINR(totals.otherChargesTotal)}
                        />
                    )}
                    <Row
                        label={_t("form.steps.review.totals.taxableValue")}
                        value={formatINR(totals.taxableValue)}
                    />
                    {totals.taxMode === "intra" && totals.cgst > 0 && (
                        <>
                            <Row
                                label={_t("form.steps.review.totals.cgst")}
                                value={formatINR(totals.cgst)}
                            />
                            <Row
                                label={_t("form.steps.review.totals.sgst")}
                                value={formatINR(totals.sgst)}
                            />
                        </>
                    )}
                    {totals.taxMode === "inter" && totals.igst > 0 && (
                        <Row
                            label={_t("form.steps.review.totals.igst")}
                            value={formatINR(totals.igst)}
                        />
                    )}
                    {totals.roundOff !== 0 && (
                        <Row
                            label={_t("form.steps.review.totals.roundOff")}
                            value={formatINR(totals.roundOff)}
                        />
                    )}

                    <div className="flex justify-between border-t pt-1.5 font-semibold">
                        <dt>{_t("form.steps.review.totals.grandTotal")}</dt>
                        <dd className="tabular-nums">
                            {formatINR(totals.grandTotal)}
                        </dd>
                    </div>

                    {totals.advanceReceived > 0 && (
                        <>
                            <Row
                                label={_t("form.steps.review.totals.advance")}
                                value={`- ${formatINR(totals.advanceReceived)}`}
                            />
                            <div className="flex justify-between font-semibold text-primary">
                                <dt>
                                    {_t("form.steps.review.totals.balance")}
                                </dt>
                                <dd className="tabular-nums">
                                    {formatINR(totals.balanceDue)}
                                </dd>
                            </div>
                        </>
                    )}
                </dl>

                <p className="mt-2 border-t pt-2 text-xs italic text-muted-foreground">
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

const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between text-muted-foreground">
        <dt>{label}</dt>
        <dd className="tabular-nums">{value}</dd>
    </div>
);

export default ServicesSection;
