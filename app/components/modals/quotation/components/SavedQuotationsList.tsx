"use client";

import React from "react";

// RHF
import { useFormContext } from "react-hook-form";

// ShadCn
import { Card, CardContent } from "@/components/ui/card";

// Components
import { BaseButton } from "@/app/components";

// Contexts
import { useDocumentContext } from "@/contexts/DocumentContext";

// Types
import type { AnyDocument } from "@/types";

type SavedDocumentsListProps = {
    setModalState: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * The documents saved in this browser, for whichever section is open.
 *
 * One component for all three kinds. The only part that genuinely differs —
 * what a row says — comes from the active section's adapter
 * (`adapter.summarise`), so a quotation row shows a rupee total, an invoice
 * row shows its payment status and a booking row shows the date of the first
 * function, without this file knowing anything about any of them.
 *
 * Upstream had to mutate each record before loading it, parsing dates into
 * Date objects and formatting them back afterwards, with a comment conceding
 * the value could not be typed while that happened. That was a consequence of
 * storing dates as formatted display strings; they are ISO here, so loading is
 * a plain `reset`.
 */
const SavedDocumentsList = ({ setModalState }: SavedDocumentsListProps) => {
    const { savedInvoices, onFormSubmit, deleteInvoice, adapter } =
        useDocumentContext();
    const { reset } = useFormContext();

    const load = (selected: AnyDocument) => {
        reset(selected as never);
        setModalState(false);
    };

    const loadAndGenerate = (selected: AnyDocument) => {
        load(selected);
        onFormSubmit(selected);
    };

    if (!savedInvoices.length) {
        return (
            <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing saved yet.
            </p>
        );
    }

    return (
        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
            {savedInvoices.map((document, index) => {
                const summary = adapter?.summarise(document);

                return (
                    <Card key={index} className="border">
                        <CardContent className="flex flex-wrap justify-between gap-3 p-3">
                            <div className="min-w-0">
                                <p className="flex flex-wrap items-center gap-2 font-semibold">
                                    {summary?.title ?? "Document"}
                                    {summary?.badge && (
                                        <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                            {summary.badge}
                                        </span>
                                    )}
                                </p>

                                {summary?.subtitle && (
                                    <p className="truncate text-sm text-muted-foreground">
                                        {summary.subtitle}
                                    </p>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    {summary?.meta}
                                    {document.details.updatedAt
                                        ? ` · updated ${document.details.updatedAt}`
                                        : ""}
                                </p>

                                {summary?.amount && (
                                    <p className="mt-1 text-sm font-semibold tabular-nums">
                                        {summary.amount}
                                    </p>
                                )}
                            </div>

                            <div className="flex shrink-0 flex-col gap-1.5">
                                <BaseButton
                                    tooltipLabel="Load this into the form"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => load(document)}
                                >
                                    Load
                                </BaseButton>

                                <BaseButton
                                    tooltipLabel="Load it and generate the PDF"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadAndGenerate(document)}
                                >
                                    Load &amp; generate
                                </BaseButton>

                                <BaseButton
                                    variant="destructive"
                                    size="sm"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        deleteInvoice(index);
                                    }}
                                >
                                    Delete
                                </BaseButton>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

export default SavedDocumentsList;
