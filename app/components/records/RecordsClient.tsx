"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { CalendarRange, FileText, Receipt, Archive, Trash2, FolderOpen } from "lucide-react";

import { readSecure, writeSecure } from "@/lib/secureStore";
import { DOCUMENT_KINDS, type DocumentKind } from "@/lib/documents/kinds";
import { ALL_ADAPTERS } from "@/lib/documents/allAdapters";
import type { AnyDocument } from "@/types";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

type KindRecord = {
    kind: DocumentKind;
    document: AnyDocument;
    index: number;
};

type AllRecords = Record<DocumentKind, AnyDocument[]>;

/* ------------------------------------------------------------------ */
/* Icon map                                                             */
/* ------------------------------------------------------------------ */

const KIND_ICONS = {
    booking: CalendarRange,
    quotation: FileText,
    invoice: Receipt,
} as const;

const KIND_ORDER: DocumentKind[] = ["booking", "quotation", "invoice"];

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export default function RecordsClient() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<AllRecords>({
        booking: [],
        quotation: [],
        invoice: [],
    });
    const [activeTab, setActiveTab] = useState<DocumentKind>("booking");
    const [deletingKey, setDeletingKey] = useState<string | null>(null);
    const [loadingKey, setLoadingKey] = useState<string | null>(null);

    /* ----------------------------------------------------------------
     * Load all three saved lists in parallel on mount.
     * ---------------------------------------------------------------- */
    const loadAll = useCallback(async () => {
        setLoading(true);
        const results = await Promise.all(
            DOCUMENT_KINDS.map((meta) =>
                readSecure<AnyDocument[]>(meta.savedKey).then(
                    (list) => [meta.id, list ?? []] as const
                )
            )
        );
        setRecords(Object.fromEntries(results) as AllRecords);
        setLoading(false);
    }, []);

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    /* ----------------------------------------------------------------
     * Load a record into its section.
     *
     * We write the selected document over the section's draftKey, then
     * navigate there. The section's DocumentContext picks it up as the
     * draft on mount.
     * ---------------------------------------------------------------- */
    const handleOpen = async ({ kind, document }: KindRecord) => {
        const key = `${kind}-open`;
        setLoadingKey(key);

        const meta = DOCUMENT_KINDS.find((m) => m.id === kind)!;
        await writeSecure(meta.draftKey, document);
        router.push(`/${meta.path}` as never);
    };

    /* ----------------------------------------------------------------
     * Delete a record from its saved list.
     * ---------------------------------------------------------------- */
    const handleDelete = async ({ kind, index }: KindRecord) => {
        const key = `${kind}-${index}`;
        setDeletingKey(key);

        const meta = DOCUMENT_KINDS.find((m) => m.id === kind)!;
        const updated = records[kind].filter((_, i) => i !== index);
        await writeSecure(meta.savedKey, updated);

        setRecords((prev) => ({ ...prev, [kind]: updated }));
        setDeletingKey(null);
    };

    /* ----------------------------------------------------------------
     * Render
     * ---------------------------------------------------------------- */
    const totalCount = KIND_ORDER.reduce(
        (sum, k) => sum + records[k].length,
        0
    );

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Archive className="h-6 w-6 text-muted-foreground" />
                <div>
                    <h2 className="text-xl font-semibold">Records</h2>
                    <p className="text-sm text-muted-foreground">
                        {loading
                            ? "Loading…"
                            : totalCount === 0
                            ? "Nothing saved yet."
                            : `${totalCount} saved ${totalCount === 1 ? "document" : "documents"}`}
                    </p>
                </div>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 border-b">
                {KIND_ORDER.map((kind) => {
                    const meta = DOCUMENT_KINDS.find((m) => m.id === kind)!;
                    const Icon = KIND_ICONS[kind];
                    const count = records[kind].length;
                    const isActive = activeTab === kind;

                    return (
                        <button
                            key={kind}
                            type="button"
                            onClick={() => setActiveTab(kind)}
                            className={cn(
                                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                                isActive
                                    ? "border-primary text-foreground"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span>{meta.label}</span>
                            {count > 0 && (
                                <span
                                    className={cn(
                                        "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                                        isActive
                                            ? "bg-primary/10 text-primary"
                                            : "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Document list */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                        <div
                            key={n}
                            className="h-24 animate-pulse rounded-lg border bg-muted/30"
                        />
                    ))}
                </div>
            ) : records[activeTab].length === 0 ? (
                <EmptyState kind={activeTab} />
            ) : (
                <div className="space-y-2">
                    {records[activeTab].map((document, index) => {
                        const adapter = ALL_ADAPTERS[activeTab];
                        const summary = adapter.summarise(document);
                        const openKey = `${activeTab}-open`;
                        const deleteKey = `${activeTab}-${index}`;

                        return (
                            <article
                                key={index}
                                className="flex flex-wrap items-start justify-between gap-4 rounded-lg border bg-card p-4"
                            >
                                {/* Summary */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-baseline gap-2">
                                        <p className="font-semibold leading-tight">
                                            {summary.title}
                                        </p>
                                        {summary.badge && (
                                            <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                                {summary.badge}
                                            </span>
                                        )}
                                    </div>

                                    {summary.subtitle && (
                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {summary.subtitle}
                                        </p>
                                    )}

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {summary.meta}
                                        {(document as { details?: { updatedAt?: string } }).details?.updatedAt
                                            ? ` · updated ${(document as { details?: { updatedAt?: string } }).details?.updatedAt}`
                                            : ""}
                                    </p>

                                    {summary.amount && (
                                        <p className="mt-1.5 font-semibold tabular-nums">
                                            {summary.amount}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex shrink-0 gap-2">
                                    <button
                                        type="button"
                                        disabled={loadingKey === openKey}
                                        onClick={() =>
                                            handleOpen({
                                                kind: activeTab,
                                                document,
                                                index,
                                            })
                                        }
                                        className={cn(
                                            "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                                            "bg-background hover:bg-muted disabled:opacity-50"
                                        )}
                                    >
                                        <FolderOpen className="h-3.5 w-3.5" />
                                        {loadingKey === openKey
                                            ? "Opening…"
                                            : "Open"}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={deletingKey === deleteKey}
                                        onClick={() =>
                                            handleDelete({
                                                kind: activeTab,
                                                document,
                                                index,
                                            })
                                        }
                                        className={cn(
                                            "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                                            "text-destructive border-destructive/30 hover:bg-destructive/10 disabled:opacity-50"
                                        )}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        {deletingKey === deleteKey
                                            ? "Deleting…"
                                            : "Delete"}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                          */
/* ------------------------------------------------------------------ */

function EmptyState({ kind }: { kind: DocumentKind }) {
    const meta = DOCUMENT_KINDS.find((m) => m.id === kind)!;
    const Icon = KIND_ICONS[kind];

    return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
            <Icon className="h-8 w-8 text-muted-foreground" />
            <div>
                <p className="font-medium">No {meta.label.toLowerCase()} saved</p>
                <p className="mt-1 text-sm text-muted-foreground">
                    Open the {meta.label.toLowerCase()} section, fill in the details and click{" "}
                    <span className="font-medium text-foreground">Save</span>.
                </p>
            </div>
        </div>
    );
}
