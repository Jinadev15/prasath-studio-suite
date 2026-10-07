"use client";

import { useMemo } from "react";

// RHF
import { useFormContext, useWatch } from "react-hook-form";

// Components
import { AutosaveIndicator, WizardStep } from "@/app/components";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

/**
 * The form shell, shared by all three sections.
 *
 * It owns the rail, the autosave indicator and the document-number badge; the
 * steps themselves come in as `steps`, so a section only has to say which
 * components it wants and in what order. Previously this file hardcoded the
 * quotation's six, which is exactly what would have had to be copied three
 * times to make three sections.
 */
const DocumentForm = ({
    steps,
    numberField,
}: {
    steps: React.ReactNode[];
    /** Where this kind keeps its document number, for the badge. */
    numberField: string;
}) => {
    const { _t } = useTranslationContext();

    const { control } = useFormContext();

    const documentNumber = useWatch({
        name: numberField,
        control,
    });

    const documentNumberLabel = useMemo(
        () => (documentNumber ? `#${documentNumber}` : _t("form.newBadge")),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [documentNumber]
    );

    /*
     * No Card here any more.
     *
     * Every field used to sit inside a card, inside a card, inside a bordered
     * step — three nested borders before you reached an input, which is most of
     * why the form read as busy. The form is now a plain column separated by
     * hairlines, and the only boxed surface left on the page is the invoice
     * preview itself.
     */
    return (
        // `min-h-0` is what actually lets a grid child shrink and scroll; without
        // it the pane grows to its content and the page scrolls instead.
        // `@container` scopes every responsive rule inside the form to the width
        // of this column rather than the viewport. Without it, a `sm:` class
        // fires on a 1440px desktop even though the form itself is a ~420px
        // rail, which is how a 12-column line-item grid ends up in 420px.
        <div className="@container min-w-0 shell:flex shell:min-h-0 shell:flex-col shell:border-e shell:border-border shell:bg-card">
            <div className="mx-auto max-w-2xl shell:min-h-0 shell:overflow-y-auto shell:p-5 xl:mx-0">
                {/*
                  * A meta row, not a heading.
                  *
                  * This used to be "Quotation" over "Generate Quotation" — a title
                  * and a subtitle labelling a form that is plainly visible,
                  * costing ~64px of a rail whose whole problem is height. What
                  * is left is the two things here a user acts on: whether the
                  * draft is saved, and which quotation this is.
                  *
                  * Still not an <h1>: every quotation template renders headings
                  * inside the live preview, so the document already carries
                  * headings made of the user's own data. The real h1 is in
                  * LandingContent.
                  */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 shell:mb-3">
                    <AutosaveIndicator />
                    <span className="text-sm font-medium text-muted-foreground">
                        {documentNumberLabel}
                    </span>
                </div>

                {/*
                 * react-use-wizard is gone; the active step lives in
                 * WizardContext. The index here lines up with the section's
                 * own step list — see lib/documents/<kind>/wizard.ts
                 */}
                {steps.map((step, index) => (
                    <WizardStep key={index} step={index}>
                        {step}
                    </WizardStep>
                ))}
            </div>
        </div>
    );
};

export default DocumentForm;
