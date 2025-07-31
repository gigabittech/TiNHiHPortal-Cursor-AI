import { Header } from "@/components/layout/header";
import { InvoiceList } from "@/components/billing/invoice-list";

export default function Billing() {
  const handleNewInvoice = () => {
    // This will be handled by the InvoiceList component
  };

  return (
    <div className="flex flex-col h-full">
      <Header 
        title="Billing & Invoices" 
        subtitle="Manage patient billing and payment processing"
        onQuickAction={handleNewInvoice}
        quickActionLabel="New Invoice"
      />
      
      <div className="flex-1 overflow-auto p-6">
        <InvoiceList onNewInvoice={handleNewInvoice} />
      </div>
    </div>
  );
}
