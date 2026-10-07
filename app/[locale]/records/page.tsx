import RecordsClient from "@/app/components/records/RecordsClient";

export const metadata = {
    title: "Records",
    description: "All saved bookings, quotations and invoices.",
};

export default function RecordsPage() {
    return (
        <main className="container py-6 pb-28 md:py-8">
            <h1 className="sr-only">Records</h1>
            <RecordsClient />
        </main>
    );
}
