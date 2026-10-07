"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { BaseButton, FormInput, FormSelect, Subheading } from "@/app/components";
import { Input } from "@/components/ui/input";

import { useTranslationContext } from "@/contexts/TranslationContext";

import {
    CREW_ROLES,
    FUNCTION_SETTINGS,
} from "@/lib/documents/booking/options";
import {
    blankFunction,
    hasMuhurtham,
} from "@/lib/documents/booking/defaults";
import { FUNCTION_TYPES, functionTypeById, SERVICE_CATALOGUE } from "@/lib/photography/catalogue";
import { TAMIL_NADU_DISTRICTS } from "@/lib/india/states";

import { CalendarDays, Plus, Trash2 } from "lucide-react";

import type { BookingType } from "@/types";

/**
 * Step 3 — the functions, which is what the whole record is really about.
 *
 * A wedding booking is three to six separate events on different days at
 * different venues, each needing its own crew. Both PDFs are built around this
 * table, and the crew call sheet is almost nothing else.
 */
const BookingFunctionsSection = () => {
    const { control } = useFormContext<BookingType>();
    const { _t } = useTranslationContext();

    const functions = useFieldArray({ control, name: "details.functions" });

    return (
        <section className="flex flex-col gap-4">
            {functions.fields.length === 0 && (
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

            {functions.fields.map((field, index) => (
                <FunctionRow
                    key={field.id}
                    index={index}
                    onRemove={functions.remove}
                />
            ))}

            <BaseButton
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => functions.append(blankFunction())}
            >
                <Plus className="h-4 w-4" />
                {_t("form.steps.functions.addFunction")}
            </BaseButton>
        </section>
    );
};

export default BookingFunctionsSection;

/* ------------------------------------------------------------------ */

/**
 * One function.
 *
 * Its own component because it watches its own `functionId` to decide whether
 * to ask for a muhurtham time — and a hook inside the parent's `.map()` would
 * change the hook count every time a function is added or removed.
 */
const FunctionRow = ({
    index,
    onRemove,
}: {
    index: number;
    onRemove: (index: number) => void;
}) => {
    const { control, register, setValue, getValues } =
        useFormContext<BookingType>();
    const { _t } = useTranslationContext();

    const base = `details.functions.${index}` as const;
    const functionId = useWatch({ control, name: `${base}.functionId` });
    const services = useWatch({ control, name: `${base}.services` });

    const showMuhurtham = hasMuhurtham(functionId);

    const handleTypeChange = (value: string) => {
        const type = functionTypeById(value);
        if (!type) return;
        // Only fill the printed name if the user has not written their own.
        const current = getValues(`${base}.label`);
        if (!current?.trim()) {
            setValue(`${base}.label`, type.label, { shouldDirty: true });
        }
    };

    const toggleService = (id: string) => {
        const current = (services as string[] | undefined) ?? [];
        setValue(
            `${base}.services`,
            current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id],
            { shouldDirty: true }
        );
    };

    return (
        <div className="rounded-lg border p-4 pt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {_t("form.steps.functions.functionType")} {index + 1}
                </span>
                <BaseButton
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(index)}
                    tooltipLabel={_t("form.steps.functions.removeFunction")}
                >
                    <Trash2 className="h-4 w-4" />
                </BaseButton>
            </div>

            <div className="flex flex-col gap-3">
                <FormSelect
                    name={`${base}.functionId`}
                    label={_t("form.steps.functions.functionType")}
                    placeholder={_t("form.steps.functions.pickFunction")}
                    options={FUNCTION_TYPES.map((type) => ({
                        value: type.id,
                        label: type.label,
                        hint: type.tamil,
                    }))}
                    onValueChange={handleTypeChange}
                />
                <FormInput
                    name={`${base}.label`}
                    label={_t("form.steps.functions.label")}
                />

                {/*
                 * Native date and time inputs rather than the popover calendar
                 * used for the enquiry date. A studio enters four or five of
                 * these in a row, and typing "12/03/2027" beats paging a
                 * calendar two years forward — wedding dates are usually set a
                 * year or more ahead.
                 */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-muted-foreground">
                            {_t("form.steps.functions.date")}
                        </span>
                        <Input type="date" {...register(`${base}.date`)} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-muted-foreground">
                            {_t("form.steps.functions.startTime")}
                        </span>
                        <Input type="time" {...register(`${base}.startTime`)} />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="text-muted-foreground">
                            {_t("form.steps.functions.endTime")}
                        </span>
                        <Input type="time" {...register(`${base}.endTime`)} />
                    </label>
                </div>

                {/*
                 * The one moment on a wedding booking that cannot be re-shot,
                 * and the crew arrives well before it — so it is its own field
                 * rather than the start of a range.
                 */}
                {showMuhurtham && (
                    <label className="flex flex-col gap-1.5 text-sm">
                        <span className="font-medium">
                            {_t("quotationDocument.muhurthamTime")}
                        </span>
                        <Input
                            type="time"
                            {...register(`${base}.muhurthamTime`)}
                        />
                    </label>
                )}

                <FormInput
                    name={`${base}.venue`}
                    label={_t("form.steps.functions.venue")}
                    placeholder="Sri Krishna Mahal"
                />
                <FormInput
                    name={`${base}.venueAddress`}
                    label={_t("quotationDocument.venueAddress")}
                />
                <FormSelect
                    name={`${base}.district`}
                    label={_t("form.steps.client.district")}
                    placeholder="—"
                    options={TAMIL_NADU_DISTRICTS.map((value) => ({
                        value,
                        label: value,
                    }))}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                    <FormInput
                        vertical
                        name={`${base}.guestCount`}
                        label={_t("form.steps.functions.guestCount")}
                        type="number"
                        min={0}
                    />
                    <FormSelect
                        vertical
                        name={`${base}.setting`}
                        label={_t("form.steps.booking.setting")}
                        placeholder="—"
                        options={FUNCTION_SETTINGS.map((value) => ({
                            value,
                            label: value,
                        }))}
                    />
                </div>

                {/* Crew counted per role, so a day's headcount can be summed. */}
                <div>
                    <Subheading>{_t("form.steps.booking.crew")}</Subheading>
                    <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                        {CREW_ROLES.map((role) => (
                            <FormInput
                                key={role.id}
                                vertical
                                name={`${base}.crew.${role.id}`}
                                label={role.label}
                                type="number"
                                min={0}
                            />
                        ))}
                    </div>
                </div>

                {/* What is wanted at this function specifically. */}
                <div>
                    <Subheading>
                        {_t("quotationDocument.servicesWanted")}
                    </Subheading>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {SERVICE_CATALOGUE.filter((service) =>
                            ["photography", "videography", "aerial-live"].includes(
                                service.category
                            )
                        ).map((service) => {
                            const selected = (
                                (services as string[] | undefined) ?? []
                            ).includes(service.id);

                            return (
                                <button
                                    key={service.id}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => toggleService(service.id)}
                                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                        selected
                                            ? "border-primary bg-primary/10 font-medium"
                                            : "hover:bg-muted"
                                    }`}
                                >
                                    {service.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <FormInput
                        vertical
                        name={`${base}.coordinatorName`}
                        label={_t("form.steps.booking.coordinatorName")}
                    />
                    <FormInput
                        vertical
                        name={`${base}.coordinatorPhone`}
                        label={_t("form.steps.booking.coordinatorPhone")}
                        inputMode="tel"
                    />
                </div>

                <FormInput
                    name={`${base}.notes`}
                    label={_t("form.steps.functions.notes")}
                />
            </div>
        </div>
    );
};
