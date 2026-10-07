"use client";

import { useState } from "react";

// ShadCn
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Components
import { SavedQuotationsList } from "@/app/components";
import { ImportJsonButton } from "@/app/components";

// Context
import { useDocumentContext } from "@/contexts/DocumentContext";

type InvoiceLoaderModalType = {
  children: React.ReactNode;
};

const QuotationLoaderModal = ({ children }: InvoiceLoaderModalType) => {
  const [open, setOpen] = useState(false);

  const { savedInvoices } = useDocumentContext();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent>
        <DialogHeader className="pb-2 border-b">
          <DialogTitle>Saved Invoices</DialogTitle>
          <DialogDescription>
            <div className="space-y-2">
              <p>You have {savedInvoices.length} saved invoices</p>
              <ImportJsonButton setOpen={setOpen}/>
            </div>
          </DialogDescription>
        </DialogHeader>

        <SavedQuotationsList setModalState={setOpen} />
      </DialogContent>
    </Dialog>
  );
};

export default QuotationLoaderModal;
