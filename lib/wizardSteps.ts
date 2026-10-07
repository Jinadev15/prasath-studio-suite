/**
 * Wizard plumbing shared by the three sections.
 *
 * The step *lists* live with their documents (`lib/documents/<kind>/wizard.ts`);
 * this module holds the type they conform to and the pure functions that
 * operate on any of them. Nothing here is React, next-intl or kind-specific,
 * so the URL sync, the progress bar, the navigation and the preview's
 * click-to-edit can all read it without importing each other.
 */

export type WizardStepDef = {
    /** Index into the rendered step list. */
    id: number;
    /**
     * URL segment for `?step=`. Not localised: a shared link should survive
     * being opened in a different language.
     */
    slug: string;
    /** Key under `form.wizard` in the message files. */
    labelKey: string;
    /**
     * Leaf field paths that must all hold a value for the step to read as
     * complete. A repeatable list (line items, functions) is not expressible
     * this way; such a step declares `completeWhen` instead.
     */
    requiredFields: string[];
    /** Error paths that mark the step invalid. */
    errorPaths: string[];
    /**
     * Bespoke completeness for steps a flat field list cannot describe.
     *
     * Replaces the hardcoded `isItemsStep(id)` check, which assumed every
     * section had a line-items step at a fixed index — true of the quotation
     * and the invoice, false of the booking.
     */
    completeWhen?: (values: Record<string, unknown>) => boolean;
    /** Extra paths this step's `completeWhen` reads. */
    watchFields?: string[];
};

export function watchedFields(steps: WizardStepDef[]): string[] {
    return Array.from(
        new Set(
            steps.flatMap((step) => [
                ...step.requiredFields,
                ...(step.watchFields ?? []),
            ])
        )
    );
}

export function stepIdFromSlug(
    steps: WizardStepDef[],
    slug: string | null | undefined
): number | null {
    if (!slug) return null;
    const step = steps.find((s) => s.slug === slug);
    return step ? step.id : null;
}

export function slugFromStepId(steps: WizardStepDef[], id: number): string {
    return (steps[id] ?? steps[0]).slug;
}

/**
 * Which step owns a given form field.
 *
 * Used by the preview's click-to-edit: clicking a region on the document has
 * to resolve to the step that contains the field before it can focus it.
 */
export function stepIdForField(
    steps: WizardStepDef[],
    path: string
): number {
    const exact = steps.find((step) =>
        step.requiredFields.some(
            (field) => path === field || path.startsWith(`${field}.`)
        )
    );
    if (exact) return exact.id;

    const byPrefix = steps.find((step) =>
        step.errorPaths.some(
            (prefix) => path === prefix || path.startsWith(`${prefix}.`)
        )
    );
    return byPrefix ? byPrefix.id : 0;
}
