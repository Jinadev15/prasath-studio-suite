"use client";

import { useEffect } from "react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import {
    BaseButton,
    DatePickerFormField,
    FormInput,
    FormSelect,
    Subheading,
} from "@/app/components";
import { Switch } from "@/components/ui/switch";

import { useTranslationContext } from "@/contexts/TranslationContext";
import { useTotals } from "@/hooks/useTotals";

import { formatINR } from "@/lib/india/currency";
import { toIsoDate, addDays, daysUntil } from "@/lib/india/dates";
import {
    PAYMENT_MODES,
    PAYMENT_TERM_PRESETS,
    paymentStatus,
    termDays,
    totalReceived,
} from "@/lib/documents/invoice/payments";

import { AlertTriangle, Plus, Trash2 } from "lucide-react";

import type { InvoiceType } from "@/types";

/**
 * Step 5 — terms, and the money that has actually arrived.
 *
 * The step where an invoice stops resembling a quotation. A quotation promises
 * a schedule of future milestones; this records receipts — date, amount, how
 * it came in and the UTR or cheque number — and derives the balance and the
 * status from them.
 *
 * Nothing here is stored twice. The total received is the sum of the rows, the
 * balance is the grand total less that sum, and the status follows from both
 * plus the due date. A studio that types a balance by hand ends up with an
 * invoice that disagrees with its own payment list.
 */
const PaymentsSection = () => {
    const { control, setValue } = useFormContext<InvoiceType>();
    const { _t } = useTranslationContext();
    const totals = useTotals();

    const payments = useFieldArray({ control, name: "details.payments" });

    const paymentValues = useWatch({ control, name: "details.payments" });
    const terms = useWatch({ control, name: "details.paymentTerms" });
    const invoiceDate = useWatch({ control, name: "details.invoiceDate" });
    const dueDate = useWatch({ control, name: "details.dueDate" });
    const reverseCharge = useWatch({ control, name: "details.reverseCharge" });

    const received = totalReceived(paymentValues);
    const status = paymentStatus({
        grandTotal: totals.grandTotal,
        received,
        dueDate,
    });

    /*
     * The due date follows from the terms and the invoice date.
     *
     * "Due on receipt" carries no date at all, which is the normal case for
     * photography — the balance is collected before the albums are handed
     * over, not thirty days after an email.
     */
    useEffect(() => {
        const days = termDays(terms);
        if (days === null) {
            if (dueDate) setValue("details.dueDate", "", { shouldDirty: true });
            return;
        }
        if (!invoiceDate) return;

        const from = new Date(invoiceDate);
        if (Number.isNaN(from.getTime())) return;

        const next = toIsoDate(addDays(from, days));
        if (next !== dueDate) {
            setValue("details.dueDate", next, { shouldDirty: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [terms, invoiceDate]);

    const overdueBy = daysUntil(dueDate);

    return (
        <section className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
                <Subheading>{_t("form.steps.payments.terms")}</Subheading>

                <FormSelect
                    name="details.paymentTerms"
                    label={_t("form.steps.payments.terms")}
                    placeholder="—"
                    options={PAYMENT_TERM_PRESETS.map((preset) => ({
                        value: preset.label,
                        label: preset.label,
                        hint:
                            preset.days === null
                                ? _t("form.steps.payments.dueOnReceiptHint")
                                : undefined,
                    }))}
                />

                <DatePickerFormField
                    name="details.dueDate"
                    label={_t("quotationDocument.dueDate")}
                />

                {overdueBy !== null && overdueBy < 0 && (
                    <p className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {_t("form.steps.payments.overdueBy", {
                            days: Math.abs(overdueBy),
                        })}
                    </p>
                )}

                <label className="flex items-center justify-between gap-3 text-sm">
                    <span>
                        {_t("quotationDocument.reverseCharge")}
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                            {_t("form.steps.payments.reverseChargeHint")}
                        </span>
                    </span>
                    <Switch
                        checked={Boolean(reverseCharge)}
                        onCheckedChange={(checked) =>
                            setValue("details.reverseCharge", checked, {
                                shouldDirty: true,
                            })
                        }
                    />
                </label>

                <FormInput
                    name="details.againstQuotation"
                    label={_t("quotationDocument.againstQuotation")}
                    placeholder="QTN/2026-27/001"
                />
            </div>

            {/* Receipts */}
            <div className="flex flex-col gap-3">
                <Subheading>{_t("form.steps.payments.heading")}</Subheading>

                {payments.fields.map((field, index) => (
                    <div key={field.id} className="rounded-lg border p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {_t("form.steps.payments.payment")} {index + 1}
                            </span>
                            <BaseButton
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => payments.remove(index)}
                                tooltipLabel={_t(
                                    "form.steps.payments.removePayment"
                                )}
                            >
                                <Trash2 className="h-4 w-4" />
                            </BaseButton>
                        </div>

                        <div className="grid gap-2.5 sm:grid-cols-2">
                            <DatePickerFormField
                                name={`details.payments.${index}.date`}
                                label={_t("quotationDocument.paymentDate")}
                            />
                            <FormInput
                                vertical
                                name={`details.payments.${index}.amount`}
                                label={_t("form.steps.services.amount")}
                                type="number"
                                min={0}
                                step="any"
                            />
                            <FormSelect
                                vertical
                                name={`details.payments.${index}.mode`}
                                label={_t("quotationDocument.paymentMode")}
                                placeholder="—"
                                options={PAYMENT_MODES.map((mode) => ({
                                    value: mode.value,
                                    label: mode.label,
                                }))}
                            />
                            <FormInput
                                vertical
                                name={`details.payments.${index}.reference`}
                                label={_t("quotationDocument.paymentReference")}
                                placeholder="UTR / cheque no"
                            />
                        </div>

                        <div className="mt-2.5">
                            <FormInput
                                name={`details.payments.${index}.note`}
                                label={_t("form.steps.terms.additionalNotes")}
                            />
                        </div>
                    </div>
                ))}

                <BaseButton
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() =>
                        payments.append({
                            date: toIsoDate(new Date()),
                            // Pre-fill the outstanding balance: the common case
                            // is recording a payment that settles what is left.
                            amount: Math.max(totals.grandTotal - received, 0),
                            mode: "upi",
                            reference: "",
                            note: "",
                        })
                    }
                >
                    <Plus className="h-4 w-4" />
                    {_t("form.steps.payments.addPayment")}
                </BaseButton>
            </div>

            {/* Where this invoice stands. */}
            <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Subheading>
                        {_t("form.steps.payments.position")}
                    </Subheading>
                    <span
                        className="rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider"
                        style={{
                            color: status.color,
                            borderColor: status.color,
                        }}
                    >
                        {status.label}
                    </span>
                </div>

                <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                        <dt>{_t("form.steps.review.totals.grandTotal")}</dt>
                        <dd className="tabular-nums">
                            {formatINR(totals.grandTotal)}
                        </dd>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <dt>{_t("quotationDocument.totalReceived")}</dt>
                        <dd className="tabular-nums">
                            - {formatINR(received)}
                        </dd>
                    </div>
                    <div className="flex justify-between border-t pt-1.5 font-semibold">
                        <dt>{_t("quotationDocument.amountDue")}</dt>
                        <dd className="tabular-nums">
                            {formatINR(Math.max(totals.grandTotal - received, 0))}
                        </dd>
                    </div>
                </dl>
            </div>
        </section>
    );
};

export default PaymentsSection;
