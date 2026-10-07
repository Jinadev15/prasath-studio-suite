import type { Metadata } from "next";

import StudioSettings from "@/app/components/studio/StudioSettings";
import { getMessages } from "@/i18n/messages";

export async function generateMetadata(props: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await props.params;
    const messages = (await getMessages(locale)) as Record<
        string,
        Record<string, string>
    >;
    const studio = messages?.studio ?? {};

    return {
        title: studio.title ?? "Studio settings",
        description: studio.description ?? "",
        // Nothing here belongs in an index: it is one person's own business
        // details, and the page is useless without their browser storage.
        robots: { index: false, follow: false },
    };
}

export default async function StudioPage(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;
    const messages = (await getMessages(locale)) as Record<
        string,
        Record<string, string>
    >;
    const studio = messages?.studio ?? {};

    return (
        <main className="container max-w-3xl py-8 pb-28 xl:pb-10">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {studio.title ?? "Studio settings"}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {studio.description ?? ""}
                </p>
            </header>

            <StudioSettings />
        </main>
    );
}
