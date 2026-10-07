/* =========================
   * Navigation
   ========================= */
import BaseNavbar from "./layout/BaseNavbar";
import BaseFooter from "./layout/BaseFooter";
import MobileActionBar from "./layout/MobileActionBar";

/* =========================
   * Quotation
   ========================= */
import DocumentMain from "./document/DocumentMain";
import DocumentForm from "./document/DocumentForm";
import DocumentActions from "./document/DocumentActions";

/* =========================
   * Form
   ========================= */
import SingleItem from "./document/form/SingleItem";
import ClientPicker from "./document/form/ClientPicker";
import ServiceCataloguePicker from "./document/form/ServiceCataloguePicker";
import StringListEditor from "./document/form/StringListEditor";
import AutosaveIndicator from "./document/form/AutosaveIndicator";
import TemplateGallery from "./document/form/TemplateGallery";

// Form / Wizard
import WizardNavigation from "./document/form/wizard/WizardNavigation";
import WizardStep from "./document/form/wizard/WizardStep";
import WizardProgress from "./document/form/wizard/WizardProgress";

// Form / Steps
import StudioSection from "./document/form/sections/StudioSection";
import ClientSection from "./document/form/sections/ClientSection";
import FunctionsSection from "./document/form/sections/FunctionsSection";
import ServicesSection from "./document/form/sections/ServicesSection";
import TermsSection from "./quotation/sections/TermsSection";
import ReviewSection from "./quotation/sections/ReviewSection";
import ImportJsonButton from "./document/form/sections/ImportJsonButton";

/* =========================
   * Actions
   ========================= */
import PdfViewer from "./document/actions/PdfViewer";
import LivePreview from "./document/actions/LivePreview";
import FinalPdf from "./document/actions/FinalPdf";
import MobilePreviewSheet from "./document/actions/MobilePreviewSheet";

/* =========================
   * Reusable components
   ========================= */
import FormInput from "./reusables/form-fields/FormInput";
import FormSelect from "./reusables/form-fields/FormSelect";
import FormTextarea from "./reusables/form-fields/FormTextarea";
import DatePickerFormField from "./reusables/form-fields/DatePickerFormField";
import FormFile from "./reusables/form-fields/FormFile";
import FormCustomInput from "./reusables/form-fields/FormCustomInput";

import BaseButton from "./reusables/BaseButton";
import ThemeSwitcher from "./reusables/ThemeSwitcher";
import LanguageSelector from "./reusables/LanguageSelector";
import TextSizeSelector from "./reusables/TextSizeSelector";
import Subheading from "./reusables/Subheading";

/* =========================
   * Modals & Alerts
   ========================= */
import SendPdfToEmailModal from "./modals/email/SendPdfToEmailModal";

// Import/Export
import QuotationLoaderModal from "./modals/quotation/QuotationLoaderModal";
import QuotationExportModal from "./modals/quotation/QuotationExportModal";
import SavedQuotationsList from "./modals/quotation/components/SavedQuotationsList";

// Signature
import SignatureModal from "./modals/signature/SignatureModal";

/*
 * Signature / Tabs
 *
 * DrawSignature is deliberately NOT re-exported here. This barrel is imported
 * by nearly every component, so a static export of the drawing tab pulled
 * react-signature-canvas and signature_pad into the initial client bundle even
 * though the canvas only ever renders inside the signature modal.
 * SignatureModal loads it through next/dynamic from its own path instead.
 */
import TypeSignature from "./modals/signature/tabs/TypeSignature";
import UploadSignature from "./modals/signature/tabs/UploadSignature";

import SignatureColorSelector from "./modals/signature/components/SignatureColorSelector";
import SignatureFontSelector from "./modals/signature/components/SignatureFontSelector";

// Alerts
import NewQuotationAlert from "./modals/alerts/NewQuotationAlert";

/* =========================
   * Templates
   ========================= */
import DynamicDocumentTemplate from "./templates/document-pdf/DynamicDocumentTemplate";
import SendPdfEmail from "./templates/email/SendPdfEmail";

export {
    BaseNavbar,
    BaseFooter,
    MobileActionBar,
    DocumentMain,
    DocumentForm,
    DocumentActions,
    StudioSection,
    ClientSection,
    FunctionsSection,
    ServicesSection,
    TermsSection,
    ReviewSection,
    SingleItem,
    ClientPicker,
    ServiceCataloguePicker,
    StringListEditor,
    AutosaveIndicator,
    TemplateGallery,
    WizardNavigation,
    WizardStep,
    WizardProgress,
    SavedQuotationsList,
    PdfViewer,
    LivePreview,
    FinalPdf,
    MobilePreviewSheet,
    FormInput,
    FormSelect,
    FormTextarea,
    DatePickerFormField,
    FormFile,
    FormCustomInput,
    BaseButton,
    ThemeSwitcher,
    LanguageSelector,
    TextSizeSelector,
    Subheading,
    SendPdfToEmailModal,
    QuotationLoaderModal,
    QuotationExportModal,
    ImportJsonButton,
    SignatureModal,
    TypeSignature,
    UploadSignature,
    SignatureColorSelector,
    SignatureFontSelector,
    NewQuotationAlert,
    DynamicDocumentTemplate,
    SendPdfEmail,
};
