import InvoiceSection from "@/app/components/sections/InvoiceSection";

export const metadata = {
    title: "Invoices",
    description: "Bill for a shoot and track what has been paid.",
};

export default function InvoicePage() {
    return (
        <main className="container py-6 pb-28 md:py-8 xl:pb-10 shell:max-w-none shell:px-0 shell:py-0 shell:pb-0">
            {/*
             * The page's one top-level heading, for screen readers and for
             * document outline. It is visually hidden on purpose: the section
             * is already named by the active tab in the navigation, and a
             * repeated 40px title would cost vertical space in a layout whose
             * whole problem is height — see DocumentForm.
             */}
            <h1 className="sr-only">Invoices</h1>
            <InvoiceSection />
        </main>
    );
}
