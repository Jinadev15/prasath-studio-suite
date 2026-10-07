"use client";

import { useFieldArray, useFormContext } from "react-hook-form";

import { BaseButton, FormInput, FormSelect } from "@/app/components";
import { Input } from "@/components/ui/input";

import { useTranslationContext } from "@/contexts/TranslationContext";

import { FUNCTION_TYPES, functionTypeById } from "@/lib/photography/catalogue";
import { blankEvent } from "@/lib/documents/quotation/defaults";
import { TAMIL_NADU_DISTRICTS } from "@/lib/india/states";

import { CalendarDays, Plus, Trash2 } from "lucide-react";

import type { QuotationType } from "@/types";

/**
 * Step 3 — the function schedule.
 *
 * This step has no equivalent in the invoice app this was forked from, and it
 * is the one that makes the document a photography quotation rather than a
 * price list. A wedding booking is three to six separate events on different
 * days at different venues, each needing its own crew; a client reads this
 * table first to check the studio has understood the brief, and the crew reads
 * it on the morning to know where to be.
 *
 * Picking a function type fills in the printed name, so the common case is two
 * clicks and a date.
 */
const FunctionsSection = () => {
    const { control, register, setValue, getValues } =
        useFormContext<QuotationType>();
    const { _t } = useTranslationContext();

    const { fields, append, remove } = useFieldArray({
        control,
        name: "details.events",
    });

    const handleTypeChange = (index: number, functionId: string) => {
        const type = functionTypeById(functionId);
        if (!type) return;

        // Only fill the printed name if the user has not written their own —
        // "Reception for the groom's side" must survive changing the type.
        const current = getValues(`details.events.${index}.label`);
        if (!current?.trim()) {
            setValue(`details.events.${index}.label`, type.label, {
                shouldDirty: true,
            });
        }
    };

    return (
        <section className="flex flex-col gap-4">
            {fields.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center">
                    <CalendarDays className="mx-auto h-7 w-7 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">
                        {_t("form.steps.functions.empty")}
                    </p>
                    <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                        {_t("form.steps.functions.emptyBody")}
                    </p>
                </div>
            )}

            {fields.map((field, index) => (
                <div
                    key={field.id}
                    className="relative rounded-lg border p-4 pt-3"
                >
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {_t("form.steps.functions.functionType")}{" "}
                            {index + 1}
                        </span>
                        <BaseButton
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(index)}
                            tooltipLabel={_t(
                                "form.steps.functions.removeFunction"
                            )}
                        >
                            <Trash2 className="h-4 w-4" />
                        </BaseButton>
                    </div>

                    <div className="flex flex-col gap-3">
                        <FormSelect
                            name={`details.events.${index}.functionId`}
                            label={_t("form.steps.functions.functionType")}
                            placeholder={_t(
                                "form.steps.functions.pickFunction"
                            )}
                            options={FUNCTION_TYPES.map((type) => ({
                                value: type.id,
                                label: type.label,
                                hint: type.tamil,
                            }))}
                            onValueChange={(value) =>
                                handleTypeChange(index, value)
                            }
                        />
                        <FormInput
                            name={`details.events.${index}.label`}
                            label={_t("form.steps.functions.label")}
                        />

                        {/*
                         * Native date and time inputs rather than the popover
                         * calendar used for the quotation date. A studio enters
                         * four or five of these in a row, and typing
                         * "12/03/2027" is faster than paging a calendar two
                         * years forward — wedding dates are often set a year
                         * or more ahead.
                         */}
                        <div className="grid gap-3 sm:grid-cols-3">
                            <label className="flex flex-col gap-1.5 text-sm">
                                <span className="text-muted-foreground">
                                    {_t("form.steps.functions.date")}
                                </span>
                                <Input
                                    type="date"
                                    {...register(
                                        `details.events.${index}.date`
                                    )}
                                />
                            </label>
                            <label className="flex flex-col gap-1.5 text-sm">
                                <span className="text-muted-foreground">
                                    {_t("form.steps.functions.startTime")}
                                </span>
                                <Input
                                    type="time"
                                    {...register(
                                        `details.events.${index}.startTime`
                                    )}
                                />
                            </label>
                            <label className="flex flex-col gap-1.5 text-sm">
                                <span className="text-muted-foreground">
                                    {_t("form.steps.functions.endTime")}
                                </span>
                                <Input
                                    type="time"
                                    {...register(
                                        `details.events.${index}.endTime`
                                    )}
                                />
                            </label>
                        </div>

                        <FormInput
                            name={`details.events.${index}.venue`}
                            label={_t("form.steps.functions.venue")}
                            placeholder="Sri Krishna Mahal"
                        />
                        <FormInput
                            name={`details.events.${index}.venueAddress`}
                            label={_t("form.steps.functions.venueAddress")}
                        />
                        <FormSelect
                            name={`details.events.${index}.city`}
                            label={_t("form.steps.functions.city")}
                            placeholder="—"
                            options={TAMIL_NADU_DISTRICTS.map((value) => ({
                                value,
                                label: value,
                            }))}
                        />
                        <FormInput
                            name={`details.events.${index}.guestCount`}
                            label={_t("form.steps.functions.guestCount")}
                            type="number"
                            min={0}
                        />
                        <FormInput
                            name={`details.events.${index}.crew`}
                            label={_t("form.steps.functions.crew")}
                            placeholder={_t(
                                "form.steps.functions.crewPlaceholder"
                            )}
                        />
                        <FormInput
                            name={`details.events.${index}.notes`}
                            label={_t("form.steps.functions.notes")}
                        />
                    </div>
                </div>
            ))}

            <BaseButton
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => append(blankEvent())}
            >
                <Plus className="h-4 w-4" />
                {_t("form.steps.functions.addFunction")}
            </BaseButton>
        </section>
    );
};

export default FunctionsSection;
