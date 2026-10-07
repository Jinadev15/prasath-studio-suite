"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { DocumentContextProvider } from "@/contexts/DocumentContext";
import { WizardProvider } from "@/contexts/WizardContext";

import type { DocumentAdapter } from "@/lib/documents/adapter";
import type { WizardStepDef } from "@/lib/wizardSteps";
import type { AnyDocument } from "@/types";

/**
 * Mounts one section of the app — quotations, invoices or bookings.
 *
 * Each section gets its own form instance, its own draft and its own saved
 * list. That is the whole reason the form provider moved out of the app-wide
 * `Providers`: with three sections under one roof, a single shared form would
 * mean switching from an invoice to a booking carried the invoice's values
 * into the booking's fields, and whichever section wrote last would own the
 * draft.
 *
 * What is *not* per-section is the studio profile. It sits above all three in
 * `Providers`, so the logo, GSTIN and bank details are entered once and every
 * section picks them up — which is the point of merging the three apps.
 */
export default function DocumentSection<T extends AnyDocument>({
    adapter,
    steps,
    children,
}: {
    adapter: DocumentAdapter<T>;
    steps: WizardStepDef[];
    children: React.ReactNode;
}) {
    const form = useForm<T>({
        resolver: zodResolver(adapter.schema as never),
        defaultValues: adapter.empty() as never,
        /*
         * Default is "onSubmit", which leaves `errors` empty until a failed
         * submit — so the wizard cannot tell "fine" from "not filled in yet".
         * onTouched surfaces problems as the user leaves a field, without
         * shouting at them mid-typing.
         */
        mode: "onTouched",
    });

    return (
        <FormProvider {...form}>
            <DocumentContextProvider adapter={adapter}>
                {/*
                 * Inside the document context, which owns hydration: the
                 * wizard's step state is meaningless until the form has been
                 * populated from the draft or the studio profile.
                 */}
                <WizardProvider steps={steps}>{children}</WizardProvider>
            </DocumentContextProvider>
        </FormProvider>
    );
}
