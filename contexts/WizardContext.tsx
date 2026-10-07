"use client";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useState,
} from "react";

import {
    slugFromStepId,
    stepIdFromSlug,
    type WizardStepDef,
} from "@/lib/wizardSteps";

/**
 * Wizard state, owned by the app rather than by react-use-wizard.
 *
 * The library kept the active step inside its own store, reachable only through
 * useWizard() inside the <Wizard> subtree. That made three things impossible:
 * the action bar and preview could not see or change the step, the step could
 * not be reflected in the URL, and clicking a region of the invoice preview had
 * no way to navigate to the field that produced it.
 *
 * It is about sixty lines to own outright, so we own it.
 */
type WizardContextValue = {
    /** This section's steps. Each of the three has its own list. */
    steps: WizardStepDef[];
    activeStep: number;
    stepCount: number;
    isFirstStep: boolean;
    isLastStep: boolean;
    goToStep: (step: number) => void;
    nextStep: () => void;
    previousStep: () => void;
};

const WizardContext = createContext<WizardContextValue | null>(null);

export const useWizard = (): WizardContextValue => {
    const ctx = useContext(WizardContext);
    if (!ctx) {
        throw new Error("useWizard must be used inside <WizardProvider>");
    }
    return ctx;
};

/**
 * useLayoutEffect on the client, useEffect on the server.
 *
 * React warns when useLayoutEffect runs during server rendering, but the
 * URL-derived step has to be applied before the browser paints or a deep link
 * visibly flashes step 1 first.
 */
const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

export const WizardProvider = ({
    steps,
    children,
}: {
    steps: WizardStepDef[];
    children: React.ReactNode;
}) => {
    const stepCount = steps.length;

    const clamp = useCallback(
        (step: number) =>
            Math.min(Math.max(Math.trunc(step) || 0, 0), stepCount - 1),
        [stepCount]
    );

    const readStepFromLocation = useCallback((): number | null => {
        if (typeof window === "undefined") return null;
        const slug = new URLSearchParams(window.location.search).get("step");
        return stepIdFromSlug(steps, slug);
    }, [steps]);

    /*
     * Always starts at 0, never at the URL's step.
     *
     * This page is statically prerendered, so the server has no query string
     * and always renders step 1. Seeding state from the URL would make the
     * first client render disagree with that markup — a hydration mismatch.
     * The URL is applied in the layout effect below instead, which runs before
     * paint, so a deep link does not flash.
     */
    const [activeStep, setActiveStep] = useState(0);

    /*
     * The step is read from `window.location`, not from next/navigation's
     * useSearchParams.
     *
     * useSearchParams forces its subtree to render dynamically and requires a
     * <Suspense> boundary. That boundary deferred hydration of the form until
     * after Providers had restored the saved draft, so a returning user's first
     * client render disagreed with the prerendered HTML — a real hydration
     * error on every visit with a draft. Reading the location directly keeps
     * the page static and the hydration boundary intact.
     */
    useIsomorphicLayoutEffect(() => {
        const fromUrl = readStepFromLocation();
        if (fromUrl !== null) setActiveStep(fromUrl);
    }, []);

    // Back/Forward between history entries that carry a different step.
    useEffect(() => {
        const onPopState = () => {
            const fromUrl = readStepFromLocation();
            setActiveStep(fromUrl ?? 0);
        };

        window.addEventListener("popstate", onPopState);
        return () => window.removeEventListener("popstate", onPopState);
    }, [readStepFromLocation]);

    const goToStep = useCallback((step: number) => {
        const next = clamp(step);
        setActiveStep(next);

        if (typeof window === "undefined") return;

        const url = new URL(window.location.href);
        url.searchParams.set("step", slugFromStepId(steps, next));

        /*
         * replaceState rather than the Next router: this is view state, not a
         * navigation. router.replace would re-fetch the RSC payload for a route
         * that has not changed, and pushing would bury whatever page the user
         * arrived from under five step entries.
         */
        window.history.replaceState(window.history.state, "", url.toString());
    }, [clamp, steps]);

    const nextStep = useCallback(
        () => goToStep(activeStep + 1),
        [activeStep, goToStep]
    );

    const previousStep = useCallback(
        () => goToStep(activeStep - 1),
        [activeStep, goToStep]
    );

    const value = useMemo(
        () => ({
            steps,
            activeStep,
            stepCount,
            isFirstStep: activeStep === 0,
            isLastStep: activeStep === stepCount - 1,
            goToStep,
            nextStep,
            previousStep,
        }),
        [steps, stepCount, activeStep, goToStep, nextStep, previousStep]
    );

    return (
        <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
    );
};
