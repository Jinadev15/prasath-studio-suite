"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import { DEFAULT_TEMPLATE_ID, getTemplateEntry } from "./registry";
import { bodyEntry } from "./bodies/registry";
import type { DocumentTemplateExtras } from "./documentLabels";
import type { BodyOptions, TemplateProps } from "./TemplateFrame";
import type { PartCtx } from "./parts";

import type { DocumentKind } from "@/lib/documents/kinds";
import type { AnyDocument } from "@/types";

const TemplateSkeleton = () => (
    // 60rem of forced height pushed the whole page down on mobile before the
    // template had even loaded.
    <Skeleton className="min-h-[30rem] w-full lg:min-h-[60rem]" />
);

type DynamicDocumentTemplateProps = DocumentTemplateExtras & {
    /**
     * The document itself, as one prop rather than spread.
     *
     * Spreading a union of three document shapes into JSX is not expressible:
     * TypeScript cannot form a spread type from a union, so every call site
     * ended up casting. One prop keeps the call sites honest and lets this
     * component do the single cast, in the one place that knows it is safe.
     */
    document: AnyDocument;
    /** Which section this document belongs to. Chooses the body. */
    kind: DocumentKind;
};

/**
 * Resolves a document to a layout and a body, and renders it.
 *
 * Two independent choices. The *layout* is the studio's taste — which masthead
 * it likes — and is the same three options whatever the document is. The
 * *body* is decided by the document's kind, because a quotation, an invoice
 * and a crew call sheet have almost nothing below the masthead in common.
 *
 * Both are resolved through registries rather than by interpolating an id into
 * a module path: an unknown id falls back to the default instead of failing
 * the import, and the registries can be enumerated for the template picker.
 */
const DynamicDocumentTemplate = (props: DynamicDocumentTemplateProps) => {
    const { document, kind, ...extras } = props;
    const details = document.details as {
        pdfTemplate?: number;
        documentType?: string;
    };

    const templateId = details?.pdfTemplate ?? DEFAULT_TEMPLATE_ID;
    const documentType = details?.documentType;

    const Layout = useMemo(() => {
        const entry =
            getTemplateEntry(templateId) ??
            getTemplateEntry(DEFAULT_TEMPLATE_ID)!;

        return dynamic<TemplateProps>(
            entry.load as never,
            { loading: () => <TemplateSkeleton />, ssr: false }
        );
    }, [templateId]);

    const Body = useMemo(() => {
        const entry = bodyEntry(kind, documentType);
        return dynamic<{ ctx: PartCtx } & BodyOptions>(entry.load as never, {
            ssr: false,
        });
    }, [kind, documentType]);

    const renderBody = useMemo(() => {
        const RenderedBody = (ctx: PartCtx, options?: BodyOptions) => (
            <Body ctx={ctx} {...options} />
        );
        return RenderedBody;
    }, [Body]);

    return (
        <Layout
            {...(document as TemplateProps)}
            {...extras}
            renderBody={renderBody}
        />
    );
};

export default React.memo(DynamicDocumentTemplate);
