"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { BaseButton, FormInput, FormSelect } from "@/app/components";

import { useTranslationContext } from "@/contexts/TranslationContext";
import { useStudioProfiles } from "@/contexts/StudioProfileContext";

import { formatINR, toPaiseRounded } from "@/lib/india/currency";
import { GST_RATES, SAC_CODES } from "@/lib/india/gst";
import { BILLING_UNITS } from "@/lib/photography/catalogue";

import { BookmarkPlus, GripVertical, Trash2 } from "lucide-react";

import type { QuotationType } from "@/types";

/**
 * One line on the quotation.
 *
 * The row shows its own computed amount — quantity × rate, less the line
 * discount — rather than holding a `total` field in the form the way upstream
 * did. A stored total is a second source of truth for a number that is already
 * determined by two others, and it goes stale the moment either changes.
 *
 * "Remember this rate" is the one button on this row that earns its place: it
 * writes the rate into the studio profile, so next month's quotation for the
 * same service is already priced. The catalogue ships no prices precisely so
 * that these are the studio's real ones.
 */
const SingleItem = ({
    index,
    onRemove,
    canRemove,
    dragHandleProps,
}: {
    index: number;
    onRemove: (index: number) => void;
    canRemove: boolean;
    dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) => {
    const { control } = useFormContext<QuotationType>();
    const { _t } = useTranslationContext();
    const { activeProfile, rememberRate } = useStudioProfiles();

    const base = `details.items.${index}` as const;

    const [serviceId, quantity, rate, discountPercent, taxMode] = useWatch({
        control,
        name: [
            `${base}.serviceId`,
            `${base}.quantity`,
            `${base}.rate`,
            `${base}.discountPercent`,
            "details.taxMode",
        ],
    });

    const gross = toPaiseRounded(Number(quantity ?? 0) * Number(rate ?? 0));
    const lineAmount = toPaiseRounded(
        gross - (gross * Number(discountPercent ?? 0)) / 100
    );

    const savedRate = serviceId
        ? activeProfile?.rates?.[serviceId]
        : undefined;
    const rateDiffers =
        Boolean(serviceId) &&
        Number(rate) > 0 &&
        savedRate !== Number(rate);

    return (
        <div className="rounded-lg border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {dragHandleProps && (
                        <button
                            type="button"
                            {...dragHandleProps}
                            aria-label={`Reorder line ${index + 1}`}
                            className="cursor-grab text-muted-foreground/60 hover:text-muted-foreground"
                        >
                            <GripVertical className="h-4 w-4" />
                        </button>
                    )}
                    {_t("form.steps.services.item")} {index + 1}
                </div>

                <div className="flex items-center gap-1">
                    {rateDiffers && activeProfile && (
                        <BaseButton
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground"
                            tooltipLabel={_t("form.steps.services.saveRate")}
                            onClick={() =>
                                void rememberRate(
                                    activeProfile.id,
                                    serviceId,
                                    Number(rate)
                                )
                            }
                        >
                            <BookmarkPlus className="h-3.5 w-3.5" />
                            {_t("form.steps.services.saveRate")}
                        </BaseButton>
                    )}

                    <BaseButton
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={!canRemove}
                        onClick={() => onRemove(index)}
                        tooltipLabel={_t("form.steps.services.removeItem")}
                    >
                        <Trash2 className="h-4 w-4" />
                    </BaseButton>
                </div>
            </div>

            <div className="flex flex-col gap-2.5">
                <FormInput
                    name={`${base}.name`}
                    label={_t("form.steps.services.name")}
                />
                <FormInput
                    name={`${base}.description`}
                    label={_t("form.steps.services.itemDescription")}
                />

                <div className="grid gap-2.5 sm:grid-cols-2">
                    <FormInput
                        vertical
                        name={`${base}.quantity`}
                        label={_t("form.steps.services.quantity")}
                        type="number"
                        min={0}
                        step="any"
                    />
                    <FormSelect
                        vertical
                        name={`${base}.unit`}
                        label={_t("form.steps.services.unit")}
                        placeholder="—"
                        options={BILLING_UNITS.map((unit) => ({
                            value: unit,
                            label: unit,
                        }))}
                    />
                    <FormInput
                        vertical
                        name={`${base}.rate`}
                        label={_t("form.steps.services.rate")}
                        type="number"
                        min={0}
                        step="any"
                        placeholder={
                            savedRate ? String(savedRate) : undefined
                        }
                    />
                    <FormInput
                        vertical
                        name={`${base}.discountPercent`}
                        label={_t("form.steps.services.discount")}
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                    />
                </div>

                {/* SAC and GST only matter when tax is actually being charged. */}
                {taxMode !== "exempt" && (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                        <FormSelect
                            vertical
                            name={`${base}.sac`}
                            label={_t("form.steps.services.sac")}
                            placeholder="—"
                            options={SAC_CODES.map((sac) => ({
                                value: sac.code,
                                label: sac.code,
                                hint: sac.label,
                            }))}
                        />
                        <FormSelect
                            vertical
                            numeric
                            name={`${base}.gstRate`}
                            label={_t("form.steps.services.gst")}
                            placeholder="—"
                            options={GST_RATES.map((gstRate) => ({
                                value: String(gstRate),
                                label: `${gstRate}%`,
                            }))}
                        />
                    </div>
                )}

                <div className="flex justify-between border-t pt-2 text-sm">
                    <span className="text-muted-foreground">
                        {_t("form.steps.services.amount")}
                    </span>
                    <span className="font-semibold tabular-nums">
                        {formatINR(lineAmount)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SingleItem;
