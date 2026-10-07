// ShadCn
import { ToastAction } from "@/components/ui/toast";
import { toast } from "@/components/ui/use-toast";

/**
 * The only fields a document cannot be generated without, in the order they
 * appear in the form. Kept in step with the `requiredText` calls in
 * `lib/documents/common.ts` — if a field becomes required there, add it here
 * so the message can name it.
 */
const REQUIRED_FIELD_LABELS = [
    { path: "studio.brandName", label: "Studio name" },
    { path: "studio.phone", label: "Studio phone number" },
    { path: "client.name", label: "Client name" },
    { path: "client.phone", label: "Client phone number" },
] as const;

/** Reads `a.b.c` out of react-hook-form's nested error object. */
const hasErrorAt = (errors: unknown, path: string): boolean => {
    let node: unknown = errors;
    for (const key of path.split(".")) {
        if (!node || typeof node !== "object") return false;
        node = (node as Record<string, unknown>)[key];
    }
    return Boolean(node);
};

/** "A", "A and B", "A, B and C" — read aloud, not comma-spliced. */
const listWithAnd = (items: readonly string[]): string =>
    items.length < 2
        ? (items[0] ?? "")
        : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

const useToasts = () => {
    type SendErrorType = {
        email: string;
        sendPdfToMail: (email: string) => void;
    };

    const clientSaved = (name: string) => {
        toast({
            variant: "default",
            title: "Client saved",
            description: `${name} is now in your client list.`,
        });
    };

    const clientRemoved = (name: string) => {
        toast({
            variant: "default",
            title: "Client removed",
            description: `${name} is no longer in your client list.`,
        });
    };

    const profileSaved = (name: string) => {
        toast({
            variant: "default",
            title: "Studio profile saved",
            description: `${name || "Your studio"} will be used on new quotations.`,
        });
    };

    const profileMissing = () => {
        toast({
            variant: "destructive",
            title: "No studio profile yet",
            description:
                "Add your studio name, address and phone number in Studio Settings first.",
        });
    };

    const newQuotationSuccess = () => {
        toast({
            variant: "default",
            title: "New quotation started",
            description: "Your studio details have been filled in.",
        });
    };

    const pdfGenerationSuccess = () => {
        toast({
            variant: "default",
            title: "Your quotation has been generated!",
            description:
                "You can preview, download, or save it from the actions tab",
        });
    };

    const saveQuotationSuccess = () => {
        toast({
            variant: "default",
            title: "Saved Quotation",
            description: "Your quotation details are saved now",
        });
    };

    const modifiedQuotationSuccess = () => {
        toast({
            variant: "default",
            title: "Modified Quotation",
            description: "Successfully modified your quotation",
        });
    };

    const sendPdfSuccess = () => {
        toast({
            variant: "default",
            title: "Email sent",
            description: "Your quotation has been sent to the specified email",
        });
    };

    const sendPdfError = ({ email, sendPdfToMail }: SendErrorType) => {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Something went wrong. Try again in a moment",
            action: (
                <ToastAction
                    onClick={() => sendPdfToMail(email)}
                    altText="Try again"
                >
                    Try again
                </ToastAction>
            ),
        });
    };

    /**
     * Surfaced when RHF rejects a submit. Without this the failure was silent
     * apart from a console.log, and on mobile the invalid field is usually on
     * a wizard step that is not currently visible.
     */
    const exportQuotationError = () => {
        toast({
            variant: "destructive",
            title: "Could not export the quotation",
            description: "Something went wrong. Try again in a moment.",
        });
    };

    const pdfGenerationError = () => {
        toast({
            variant: "destructive",
            title: "Could not generate the PDF",
            description: "Something went wrong. Try again in a moment.",
        });
    };

    /**
     * Only four fields are required to produce a document — the studio's name
     * and phone, and the client's name and phone. Everything else is optional
     * and simply does not print when it is blank.
     *
     * Because the list is that short, the toast names the fields that are
     * actually missing rather than saying "some required fields". The previous
     * wording sent people hunting through six steps for a problem that was
     * always one of four fields.
     */
    const formValidationError = (errors?: unknown) => {
        const missing = REQUIRED_FIELD_LABELS.filter(({ path }) =>
            hasErrorAt(errors, path)
        ).map(({ label }) => label);

        toast({
            variant: "destructive",
            title: missing.length
                ? "Fill these in first"
                : "Please check the form",
            description: missing.length
                ? `${listWithAnd(missing)} ${
                      missing.length === 1 ? "is" : "are"
                  } needed before this can be generated. Nothing else is required.`
                : "Something in the form is invalid. Steps with errors are marked in the progress bar.",
        });
    };

    const importQuotationError = () => {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Something went importing the quotation. Make sure the file is a valid Invoify JSON export",
        });
    };

    return {
        clientSaved,
        clientRemoved,
        profileSaved,
        profileMissing,
        newQuotationSuccess,
        pdfGenerationSuccess,
        saveQuotationSuccess,
        modifiedQuotationSuccess,
        sendPdfSuccess,
        sendPdfError,
        pdfGenerationError,
        exportQuotationError,
        formValidationError,
        importQuotationError,
    };
};

export default useToasts;
