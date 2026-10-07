"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import {
    BaseButton,
    FormInput,
    FormTextarea,
    StringListEditor,
    Subheading,
} from "@/app/components";
import { Switch } from "@/components/ui/switch";

import { useTranslationContext } from "@/contexts/TranslationContext";
import { useStudioProfiles } from "@/contexts/StudioProfileContext";
import { useTotals } from "@/hooks/useTotals";

import { formatINR } from "@/lib/india/currency";
import { DEFAULT_DELIVERY_TIMELINE } from "@/lib/photography/catalogue";

import { AlertTriangle, Plus, RotateCcw, Trash2 } from "lucide-react";

import type { QuotationType } from "@/types";

/**
 * Step 5 — payment staging, deliverable turnaround, and the fine print.
 *
 * The payment schedule is the part worth the screen space. Wedding work is
 * booked months ahead and paid in stages, so a single "due on receipt" line
 * describes no real booking — and leaving the stages verbal is how a studio
 * ends up chasing the balance after the albums have shipped. The percentages
 * are shown with the rupee figure they resolve to, and a warning fires when
 * they do not add to 100.
 */
const TermsSection = () => {
    const { control, setValue } = useFormContext<QuotationType>();
    const { _t } = useTranslationContext();
    const { activeProfile } = useStudioProfiles();
    const totals = useTotals();

    const schedule = useFieldArray({
        control,
        name: "details.paymentSchedule",
    });
    const timeline = useFieldArray({
        control,
        name: "details.deliveryTimeline",
    });
    const tiers = useFieldArray({ control, name: "details.packageTiers" });
    const addOns = useFieldArray({ control, name: "details.addOns" });

    const scheduleValues = useWatch({
        control,
        name: "details.paymentSchedule",
    });
    const sections = useWatch({ control, name: "details.sections" });

    const schedulePercent = (scheduleValues ?? []).reduce(
        (sum, milestone) => sum + Number(milestone?.percent ?? 0),
        0
    );
    const scheduleBalanced = Math.abs(schedulePercent - 100) < 0.01;

    const resetFromProfile = (
        key: "inclusions" | "exclusions" | "terms"
    ) => {
        if (!activeProfile) return;
        const source = {
            inclusions: activeProfile.defaultInclusions,
            exclusions: activeProfile.defaultExclusions,
            terms: activeProfile.defaultTerms,
        }[key];
        setValue(`details.${key}`, [...source], { shouldDirty: true });
    };

    return (
        <section className="flex flex-col gap-6">
            {/* Payment schedule */}
            <div className="flex flex-col gap-3">
                <Subheading>
                    {_t("form.steps.terms.paymentSchedule")}
                </Subheading>

                {schedule.fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_5rem_auto]"
                    >
                        <FormInput
                            vertical
                            name={`details.paymentSchedule.${index}.label`}
                            label={_t("form.steps.terms.milestoneLabel")}
                        />
                        <FormInput
                            vertical
                            name={`details.paymentSchedule.${index}.due`}
                            label={_t("form.steps.terms.milestoneDue")}
                        />
                        <FormInput
                            vertical
                            name={`details.paymentSchedule.${index}.percent`}
                            label={_t("form.steps.terms.milestonePercent")}
                            type="number"
                            min={0}
                            max={100}
                            step="any"
                        />
                        <BaseButton
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => schedule.remove(index)}
                            tooltipLabel={_t(
                                "form.steps.terms.removeMilestone"
                            )}
                        >
                            <Trash2 className="h-4 w-4" />
                        </BaseButton>
                    </div>
                ))}

                {schedule.fields.length > 0 && (
                    <div className="space-y-1 rounded-md border bg-muted/30 p-2.5 text-sm">
                        {(scheduleValues ?? []).map((milestone, index) => (
                            <div
                                key={index}
                                className="flex justify-between text-muted-foreground"
                            >
                                <span>
                                    {milestone?.label || "—"}{" "}
                                    <span className="tabular-nums">
                                        ({milestone?.percent ?? 0}%)
                                    </span>
                                </span>
                                <span className="tabular-nums">
                                    {formatINR(
                                        (totals.grandTotal *
                                            Number(milestone?.percent ?? 0)) /
                                            100
                                    )}
                                </span>
                            </div>
                        ))}

                        {!scheduleBalanced && (
                            <p className="flex items-center gap-1.5 border-t pt-1.5 text-xs text-amber-600">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                {_t("form.steps.terms.scheduleMismatch", {
                                    percent:
                                        Math.round(schedulePercent * 100) / 100,
                                })}
                            </p>
                        )}
                    </div>
                )}

                <BaseButton
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() =>
                        schedule.append({ label: "", percent: 0, due: "" })
                    }
                >
                    <Plus className="h-4 w-4" />
                    {_t("form.steps.terms.addMilestone")}
                </BaseButton>
            </div>

            {/* Delivery timeline */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                    <Subheading>
                        {_t("form.steps.terms.deliveryTimeline")}
                    </Subheading>
                    <BaseButton
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() =>
                            timeline.replace(
                                DEFAULT_DELIVERY_TIMELINE.map((t) => ({
                                    ...t,
                                }))
                            )
                        }
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        {_t("form.steps.terms.resetFromProfile")}
                    </BaseButton>
                </div>

                {timeline.fields.map((field, index) => (
                    <div
                        key={field.id}
                        className="grid items-end gap-2 sm:grid-cols-[1fr_6rem_auto]"
                    >
                        <FormInput
                            vertical
                            name={`details.deliveryTimeline.${index}.item`}
                            label={_t("form.steps.terms.timelineItem")}
                        />
                        <FormInput
                            vertical
                            name={`details.deliveryTimeline.${index}.days`}
                            label={_t("form.steps.terms.timelineDays")}
                            type="number"
                            min={0}
                        />
                        <BaseButton
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={() => timeline.remove(index)}
                            tooltipLabel={_t("form.steps.terms.removeLine")}
                        >
                            <Trash2 className="h-4 w-4" />
                        </BaseButton>
                    </div>
                ))}

                <BaseButton
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => timeline.append({ item: "", days: 30 })}
                >
                    <Plus className="h-4 w-4" />
                    {_t("form.steps.terms.addTimeline")}
                </BaseButton>
            </div>

            {/* Inclusions / exclusions / terms */}
            {(
                [
                    ["inclusions", "form.steps.terms.inclusions"],
                    ["exclusions", "form.steps.terms.exclusions"],
                    ["terms", "form.steps.terms.terms"],
                ] as const
            ).map(([key, labelKey]) => (
                <div key={key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                        <Subheading>{_t(labelKey)}</Subheading>
                        {activeProfile && (
                            <BaseButton
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={() => resetFromProfile(key)}
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                {_t("form.steps.terms.resetFromProfile")}
                            </BaseButton>
                        )}
                    </div>
                    <StringListEditor
                        name={`details.${key}`}
                        addLabel={_t("form.steps.terms.addLine")}
                        removeLabel={_t("form.steps.terms.removeLine")}
                    />
                </div>
            ))}

            {/* Optional: tier comparison */}
            <div className="flex flex-col gap-3 rounded-lg border p-4">
                <label className="flex items-center justify-between gap-3">
                    <span>
                        <Subheading>
                            {_t("form.steps.terms.packageTiers")}
                        </Subheading>
                        <span className="mt-1 block text-xs text-muted-foreground">
                            {_t("form.steps.terms.packageTiersHint")}
                        </span>
                    </span>
                    <Switch
                        checked={Boolean(sections?.packageTiers)}
                        onCheckedChange={(checked) =>
                            setValue("details.sections.packageTiers", checked, {
                                shouldDirty: true,
                            })
                        }
                    />
                </label>

                {sections?.packageTiers && (
                    <>
                        {tiers.fields.map((field, index) => (
                            <TierRow
                                key={field.id}
                                index={index}
                                onRemove={tiers.remove}
                            />
                        ))}

                        <BaseButton
                            variant="outline"
                            size="sm"
                            className="w-fit"
                            onClick={() =>
                                tiers.append({
                                    name: "",
                                    tagline: "",
                                    amount: 0,
                                    highlights: [],
                                    recommended: false,
                                })
                            }
                        >
                            <Plus className="h-4 w-4" />
                            {_t("form.steps.terms.addTier")}
                        </BaseButton>
                    </>
                )}
            </div>

            {/* Optional: add-ons */}
            <div className="flex flex-col gap-3 rounded-lg border p-4">
                <label className="flex items-center justify-between gap-3">
                    <span>
                        <Subheading>
                            {_t("form.steps.terms.addOns")}
                        </Subheading>
                        <span className="mt-1 block text-xs text-muted-foreground">
                            {_t("form.steps.terms.addOnsHint")}
                        </span>
                    </span>
                    <Switch
                        checked={Boolean(sections?.addOns)}
                        onCheckedChange={(checked) =>
                            setValue("details.sections.addOns", checked, {
                                shouldDirty: true,
                            })
                        }
                    />
                </label>

                {sections?.addOns && (
                    <>
                        {addOns.fields.map((field, index) => (
                            <div
                                key={field.id}
                                className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_6rem_auto]"
                            >
                                <FormInput
                                    vertical
                                    name={`details.addOns.${index}.name`}
                                    label={_t("form.steps.services.name")}
                                />
                                <FormInput
                                    vertical
                                    name={`details.addOns.${index}.description`}
                                    label={_t(
                                        "form.steps.services.itemDescription"
                                    )}
                                />
                                <FormInput
                                    vertical
                                    name={`details.addOns.${index}.rate`}
                                    label={_t("form.steps.services.rate")}
                                    type="number"
                                    min={0}
                                    step="any"
                                />
                                <BaseButton
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                    onClick={() => addOns.remove(index)}
                                    tooltipLabel={_t(
                                        "form.steps.terms.removeLine"
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
                                addOns.append({
                                    name: "",
                                    description: "",
                                    unit: "",
                                    rate: 0,
                                })
                            }
                        >
                            <Plus className="h-4 w-4" />
                            {_t("form.steps.terms.addAddOn")}
                        </BaseButton>
                    </>
                )}
            </div>

            <div className="flex flex-col gap-3">
                <Subheading>
                    {_t("form.steps.services.advanceReceived")}
                </Subheading>
                <FormInput
                    name="details.advanceReceived"
                    label={_t("form.steps.services.advanceReceived")}
                    type="number"
                    min={0}
                    step="any"
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
        </section>
    );
};

export default TermsSection;

/* ------------------------------------------------------------------ */

/**
 * One tier row.
 *
 * Its own component because the "recommended" switch has to watch its own
 * value: a Switch is uncontrolled unless given one, and `useFieldArray`'s
 * `fields` snapshot does not update when a nested value changes, so reading
 * the flag off `fields[index]` leaves the switch stuck where it started.
 * Watching it inside the parent's `.map()` would put a hook in a loop, where
 * the hook count changes as tiers are added and removed.
 */
const TierRow = ({
    index,
    onRemove,
}: {
    index: number;
    onRemove: (index: number) => void;
}) => {
    const { control, setValue } = useFormContext<QuotationType>();
    const { _t } = useTranslationContext();

    const recommended = useWatch({
        control,
        name: `details.packageTiers.${index}.recommended`,
    });

    return (
        <div className="space-y-2 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {_t("form.steps.terms.tierName")} {index + 1}
                </span>
                <BaseButton
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(index)}
                    tooltipLabel={_t("form.steps.terms.removeLine")}
                >
                    <Trash2 className="h-4 w-4" />
                </BaseButton>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
                <FormInput
                    vertical
                    name={`details.packageTiers.${index}.name`}
                    label={_t("form.steps.terms.tierName")}
                />
                <FormInput
                    vertical
                    name={`details.packageTiers.${index}.tagline`}
                    label={_t("form.steps.terms.tierTagline")}
                />
                <FormInput
                    vertical
                    name={`details.packageTiers.${index}.amount`}
                    label={_t("form.steps.terms.tierAmount")}
                    type="number"
                    min={0}
                    step="any"
                />
            </div>

            <label className="flex items-center gap-2 text-sm">
                <Switch
                    checked={Boolean(recommended)}
                    onCheckedChange={(checked) =>
                        setValue(
                            `details.packageTiers.${index}.recommended`,
                            checked,
                            { shouldDirty: true }
                        )
                    }
                />
                {_t("form.steps.terms.tierRecommended")}
            </label>
        </div>
    );
};
