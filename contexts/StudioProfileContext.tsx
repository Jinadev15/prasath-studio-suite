"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    blankProfile,
    deleteProfile as deleteProfileFromStore,
    readActiveProfileId,
    readProfiles,
    saveProfile as saveProfileToStore,
    setActiveProfileId,
    consumeSequence as consumeSequenceInStore,
    rememberRate as rememberRateInStore,
    type StudioProfile,
} from "@/lib/studio/profile";
import type { DocumentKind } from "@/lib/documents/kinds";

/**
 * The studio profiles, loaded once and shared.
 *
 * Every screen needs them — the form's studio step, the settings page, the
 * "new quotation" action that seeds a document from the active profile — and
 * reading them is an async decrypt through IndexedDB, so doing it per
 * component would mean several decrypts on first paint and components
 * disagreeing about which profile is active while they resolve.
 */

type StudioProfileContextValue = {
    profiles: StudioProfile[];
    activeProfile: StudioProfile | null;
    /** True until the first read from storage has resolved. */
    loading: boolean;
    saveProfile: (profile: StudioProfile) => Promise<StudioProfile>;
    deleteProfile: (id: string) => Promise<void>;
    selectProfile: (id: string) => Promise<void>;
    createProfile: () => Promise<StudioProfile>;
    duplicateProfile: (id: string) => Promise<StudioProfile | null>;
    /** Advances the numbering series, after a document is actually issued. */
    consumeSequence: (profileId: string, kind: DocumentKind) => Promise<void>;
    /** Stores a rate the user just typed, for the next quotation. */
    rememberRate: (
        profileId: string,
        serviceId: string,
        rate: number
    ) => Promise<void>;
    replaceAll: (profiles: StudioProfile[]) => Promise<void>;
};

const StudioProfileContext = createContext<StudioProfileContextValue | null>(
    null
);

export const StudioProfileProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [profiles, setProfiles] = useState<StudioProfile[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    /*
     * Read on mount rather than during render: storage is unavailable on the
     * server, and reading it while rendering would make the first client
     * render disagree with the prerendered HTML.
     */
    useEffect(() => {
        let active = true;

        (async () => {
            const [stored, storedActiveId] = await Promise.all([
                readProfiles(),
                readActiveProfileId(),
            ]);
            if (!active) return;

            setProfiles(stored);
            setActiveId(storedActiveId);
            setLoading(false);
        })();

        return () => {
            active = false;
        };
    }, []);

    /**
     * Falls back to the first profile when the active id points at one that
     * has since been deleted, and to null when nothing is saved at all — which
     * the form reads as "send the user to settings first".
     */
    const activeProfile = useMemo(() => {
        if (!profiles.length) return null;
        return profiles.find((p) => p.id === activeId) ?? profiles[0];
    }, [profiles, activeId]);

    const saveProfile = useCallback(async (profile: StudioProfile) => {
        const next = await saveProfileToStore(profile);
        setProfiles(next);

        // First profile saved becomes the active one; otherwise the user's
        // choice stands.
        setActiveId((current) => {
            if (current) return current;
            void setActiveProfileId(profile.id);
            return profile.id;
        });

        return next.find((p) => p.id === profile.id) ?? profile;
    }, []);

    const deleteProfile = useCallback(async (id: string) => {
        const next = await deleteProfileFromStore(id);
        setProfiles(next);
        setActiveId(await readActiveProfileId());
    }, []);

    const selectProfile = useCallback(async (id: string) => {
        setActiveId(id);
        await setActiveProfileId(id);
    }, []);

    const createProfile = useCallback(async () => {
        const profile = blankProfile();
        await saveProfile(profile);
        await selectProfile(profile.id);
        return profile;
    }, [saveProfile, selectProfile]);

    const duplicateProfile = useCallback(
        async (id: string) => {
            const source = profiles.find((p) => p.id === id);
            if (!source) return null;

            const copy = {
                ...source,
                id: blankProfile().id,
                brandName: `${source.brandName} (copy)`,
                // A duplicate that keeps the original's next number would
                // issue two documents with the same identifier.
                nextSequence: 1,
            };
            await saveProfile(copy);
            return copy;
        },
        [profiles, saveProfile]
    );

    const consumeSequence = useCallback(
        async (profileId: string, kind: DocumentKind) => {
            await consumeSequenceInStore(profileId, kind);
            setProfiles(await readProfiles());
        },
        []
    );

    const rememberRate = useCallback(
        async (profileId: string, serviceId: string, rate: number) => {
            await rememberRateInStore(profileId, serviceId, rate);
            setProfiles(await readProfiles());
        },
        []
    );

    const replaceAll = useCallback(async (incoming: StudioProfile[]) => {
        // Imported profiles are appended, not substituted: someone importing a
        // colleague's setup onto a laptop that already has their own should not
        // silently lose theirs.
        const existing = await readProfiles();
        const byId = new Map(existing.map((p) => [p.id, p]));
        for (const profile of incoming) byId.set(profile.id, profile);

        const merged = [...byId.values()];
        for (const profile of merged) await saveProfileToStore(profile);
        setProfiles(await readProfiles());
    }, []);

    const value = useMemo<StudioProfileContextValue>(
        () => ({
            profiles,
            activeProfile,
            loading,
            saveProfile,
            deleteProfile,
            selectProfile,
            createProfile,
            duplicateProfile,
            consumeSequence,
            rememberRate,
            replaceAll,
        }),
        [
            profiles,
            activeProfile,
            loading,
            saveProfile,
            deleteProfile,
            selectProfile,
            createProfile,
            duplicateProfile,
            consumeSequence,
            rememberRate,
            replaceAll,
        ]
    );

    return (
        <StudioProfileContext.Provider value={value}>
            {children}
        </StudioProfileContext.Provider>
    );
};

export const useStudioProfiles = () => {
    const context = useContext(StudioProfileContext);
    if (!context) {
        throw new Error(
            "useStudioProfiles must be used inside a StudioProfileProvider"
        );
    }
    return context;
};
