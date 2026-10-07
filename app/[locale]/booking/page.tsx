import BookingSection from "@/app/components/sections/BookingSection";

export const metadata = {
    title: "Bookings",
    description: "Capture an event enquiry and brief the crew.",
};

export default function BookingPage() {
    return (
        <main className="container py-6 pb-28 md:py-8 xl:pb-10 shell:max-w-none shell:px-0 shell:py-0 shell:pb-0">
            {/*
             * The page's one top-level heading, for screen readers and for
             * document outline. It is visually hidden on purpose: the section
             * is already named by the active tab in the navigation, and a
             * repeated 40px title would cost vertical space in a layout whose
             * whole problem is height — see DocumentForm.
             */}
            <h1 className="sr-only">Bookings</h1>
            <BookingSection />
        </main>
    );
}
