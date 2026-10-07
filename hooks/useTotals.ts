"use client";

import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { computeTotals, type Totals } from "@/lib/india/gst";

import type { QuotationType } from "@/types";

/**
 * Every figure on the document, derived from the form.
 *
 * One hook so the summary panel, the payment schedule's amount column and the
 * balance line all read the same numbers. Upstream kept a ChargesContext that
 * wrote computed totals *back into the form* as `subTotal`, `totalAmount` and
 * `totalAmountInWords` fields — which meant the stored document carried
 * figures that the template then recomputed, and a stale stored total silently
 * won on reload. Totals are derived, never stored.
 *
 * The watch is narrowed to the fields that actually feed the arithmetic, so
 * typing a client's name does not re-run it.
 */
export function useTotals(): Totals {
    const { control } = useFormContext<QuotationType>();

    const [items, taxMode, discount, otherCharges, roundOff, advanceReceived] =
        useWatch({
            control,
            name: [
                "details.items",
                "details.taxMode",
                "details.discount",
                "details.otherCharges",
                "details.roundOff",
                "details.advanceReceived",
            ],
        });

    return useMemo(
        () =>
            computeTotals({
                items: items ?? [],
                taxMode: taxMode ?? "intra",
                discount,
                otherCharges,
                roundOff,
                advanceReceived,
            }),
        [items, taxMode, discount, otherCharges, roundOff, advanceReceived]
    );
}
