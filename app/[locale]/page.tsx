import { redirect } from "next/navigation";

/**
 * The app has three sections and no separate home.
 *
 * A dashboard here would be a page the user passes through on the way to the
 * thing they opened the app to do. The section navigation is always visible,
 * so landing straight in Quotations costs nothing and saves a click.
 */
export default async function Home(props: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await props.params;
    redirect(`/${locale}/quotation`);
}
