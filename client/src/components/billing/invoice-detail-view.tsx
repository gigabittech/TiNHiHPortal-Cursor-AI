import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  Printer, 
  Mail, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText,
  CreditCard,
  DollarSign,
  Edit,
  MoreHorizontal,
  ArrowLeft,
  History
} from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import { StripePaymentWrapper } from "@/components/payments/payment-form";
import { PaymentHistory } from "@/components/payments/payment-history";
import tinhihLogo from "@assets/tinhih-logo.svg";
// Using the official TiNHiH SVG logo
const logoPath = tinhihLogo;

interface InvoiceDetailViewProps {
  invoice: any;
  onEdit: () => void;
  onClose: () => void;
}

export function InvoiceDetailView({ invoice, onEdit, onClose }: InvoiceDetailViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showEmailSheet, setShowEmailSheet] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState(`Invoice ${invoice.invoiceNumber} from TiNHiH Portal`);

  const isPatient = user?.role === "patient";
  const canMakePayment = isPatient && invoice.status !== "paid";

  // Update invoice status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      return api.put(`/api/invoices/${invoice.id}`, { 
        status,
        ...(status === "paid" && { paidAt: new Date().toISOString() })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update invoice status",
        variant: "destructive",
      });
    },
  });



  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><FileText className="w-3 h-3 mr-1" />Sent</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-200"><Clock className="w-3 h-3 mr-1" />Draft</Badge>;
    }
  };

  const handleDownload = () => {
    // Create a new window for PDF generation that matches the current invoice layout exactly
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice-${invoice.invoiceNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 32px; 
            color: #1e293b; 
            background: white;
            line-height: 1.5;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 32px; 
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .invoice-title { 
            font-size: 32px; 
            font-weight: bold; 
            color: #1e293b; 
            margin: 0;
          }
          .company-name { 
            color: #64748b; 
            margin-top: 5px; 
            font-size: 16px;
          }
          .header-right {
            text-align: right;
          }
          .invoice-number { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 8px; 
            color: #1e293b;
          }
          .status { 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: 600; 
            text-transform: uppercase; 
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }
          .status-paid { background: #dcfce7; color: #166534; }
          .status-draft { background: #f1f5f9; color: #475569; }
          .status-sent { background: #dbeafe; color: #1d4ed8; }
          .status-overdue { background: #fecaca; color: #991b1b; }
          .grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 32px; 
            margin-bottom: 32px; 
          }
          .bill-to {
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .invoice-details {
            text-align: right;
          }
          .section-title { 
            font-size: 12px; 
            font-weight: 600; 
            text-transform: uppercase; 
            color: #64748b; 
            margin-bottom: 12px; 
            letter-spacing: 0.5px; 
          }
          .invoice-details .section-title {
            text-align: right;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .detail-label {
            color: #64748b;
          }
          .detail-value {
            font-weight: 500;
          }
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 32px 0; 
            background: #f8fafc;
            border-radius: 8px;
            overflow: hidden;
          }
          .table th, .table td { 
            padding: 16px 24px; 
            text-align: left; 
            border-bottom: 1px solid #e2e8f0;
          }
          .table th { 
            background-color: #e2e8f0; 
            font-weight: 600; 
            color: #1e293b; 
            font-size: 14px;
          }
          .table td {
            color: #1e293b;
          }
          .service-description {
            color: #64748b;
            font-size: 14px;
            margin-top: 4px;
            white-space: pre-wrap;
          }
          .appointment-info {
            color: #9ca3af;
            font-size: 12px;
            margin-top: 4px;
          }
          .total-section { 
            width: 320px; 
            margin-left: auto; 
            margin-bottom: 32px;
          }
          .total-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
          }
          .total-row.final { 
            border-top: 1px solid #e2e8f0; 
            font-weight: bold; 
            font-size: 18px; 
            padding: 12px 0; 
            margin-top: 12px;
          }
          .from-section {
            width: 320px;
            margin-bottom: 32px;
          }
          .paid-notice { 
            background: #f0fdf4; 
            border: 1px solid #bbf7d0; 
            border-radius: 8px; 
            padding: 24px; 
            margin-bottom: 32px;
            display: flex;
            align-items: center;
          }
          .paid-icon {
            width: 24px;
            height: 24px;
            background: #16a34a;
            border-radius: 50%;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
          }
          .footer { 
            text-align: center; 
            color: #64748b; 
            font-size: 14px; 
            border-top: 1px solid #e2e8f0; 
            padding-top: 24px; 
            margin-top: 40px; 
          }
          @media print {
            body { margin: 0; padding: 20px; }
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div>
              <h1 class="invoice-title">Invoice</h1>
              <p class="company-name">TiNHiH Portal Healthcare</p>
            </div>
          </div>
          <div class="header-right">
            <div class="invoice-number">#${invoice.invoiceNumber}</div>
            <span class="status status-${invoice.status}">
              ${invoice.status === 'paid' ? '✓' : invoice.status === 'overdue' ? '✗' : invoice.status === 'sent' ? '📄' : '⏱️'} 
              ${invoice.status}
            </span>
          </div>
        </div>

        <!-- Bill To and Invoice Details Grid -->
        <div class="grid">
          <div class="bill-to">
            <div class="section-title">Bill To</div>
            <div>
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">
                ${invoice.patient?.user?.firstName || 'N/A'} ${invoice.patient?.user?.lastName || 'N/A'}
              </div>
              <div style="color: #64748b;">${invoice.patient?.user?.email || 'N/A'}</div>
              <div style="color: #64748b;">${invoice.patient?.user?.phone || 'N/A'}</div>
              ${invoice.patient?.address ? `<div style="color: #64748b;">${invoice.patient.address}</div>` : ''}
            </div>
          </div>
          <div class="invoice-details">
            <div class="section-title">Invoice Details</div>
            <div style="space-y: 8px;">
              <div class="detail-row">
                <span class="detail-label">Invoice Number:</span>
                <span class="detail-value">${invoice.invoiceNumber}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date Issued:</span>
                <span class="detail-value">${new Date(invoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              ${invoice.dueDate ? `
              <div class="detail-row">
                <span class="detail-label">Due Date:</span>
                <span class="detail-value">${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>` : ''}
              ${invoice.status === 'paid' && invoice.paidAt ? `
              <div class="detail-row">
                <span class="detail-label">Paid Date:</span>
                <span class="detail-value" style="color: #059669;">${new Date(invoice.paidAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>` : ''}
            </div>
          </div>
        </div>

        <!-- Services Table -->
        <table class="table">
          <thead>
            <tr>
              <th>Service</th>
              <th style="width: 100px; text-align: center;">Units</th>
              <th style="width: 120px; text-align: right;">Price</th>
              <th style="width: 120px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div style="font-weight: 500; color: #1e293b;">Healthcare Services</div>
                <div class="service-description">${invoice.description}</div>
                ${invoice.appointment ? `<div class="appointment-info">Related to appointment on ${new Date(invoice.appointment.appointmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>` : ''}
              </td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">$${Number(invoice.amount || 0).toFixed(2)}</td>
              <td style="text-align: right; font-weight: 500;">$${Number(invoice.amount || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Total Section -->
        <div class="total-section">
          <div class="total-row">
            <span style="color: #64748b;">Subtotal:</span>
            <span style="font-weight: 500;">$${Number(invoice.amount || 0).toFixed(2)}</span>
          </div>
          ${Number(invoice.tax || 0) > 0 ? `
          <div class="total-row">
            <span style="color: #64748b;">Tax:</span>
            <span style="font-weight: 500;">$${Number(invoice.tax || 0).toFixed(2)}</span>
          </div>` : ''}
          <div class="total-row final">
            <span>Total:</span>
            <span>$${Number(invoice.total || 0).toFixed(2)}</span>
          </div>
        </div>

        <!-- FROM Section -->
        <div class="from-section">
          <div class="section-title">From</div>
          <div>
            <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">
              Dr. ${invoice.practitioner?.user?.firstName || 'N/A'} ${invoice.practitioner?.user?.lastName || 'N/A'}
            </div>
            <div style="font-weight: 600; color: #64748b; margin-bottom: 4px;">TiNHiH Portal Healthcare</div>
            <div style="color: #64748b;">${invoice.practitioner?.user?.email || 'contact@tinhih.com'}</div>
            <div style="color: #64748b;">${invoice.practitioner?.user?.phone || '+1-555-HEALTH'}</div>
            <div style="color: #64748b;">123 Medical Center Drive</div>
            <div style="color: #64748b;">Healthcare City, HC 12345</div>
          </div>
        </div>

        <!-- Payment Status -->
        ${invoice.status === 'paid' ? `
        <div class="paid-notice">
          <div class="paid-icon">✓</div>
          <div>
            <div style="font-weight: 600; color: #166534;">Payment Received</div>
            <div style="color: #15803d;">This invoice was paid on ${new Date(invoice.paidAt || invoice.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
          </div>
        </div>` : ''}

        <!-- Footer -->
        <div class="footer">
          <p><strong>Thank you for choosing TiNHiH Portal Healthcare</strong></p>
          <p style="margin-top: 4px;">For questions about this invoice, please contact us at support@tinhih.com</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    
    // Set proper filename and trigger print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = () => {
    if (!emailAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would trigger an email service
    toast({
      title: "Email Sent",
      description: `Invoice sent to ${emailAddress}`,
    });
    setShowEmailSheet(false);
    setEmailAddress("");
  };



  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose} className="text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <div className="h-6 w-px bg-slate-300"></div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Invoice {invoice.invoiceNumber}</h1>
            <p className="text-sm text-slate-500">Invoice Details</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Always show payment button for testing purposes */}
          <Button onClick={() => setShowPaymentDialog(true)} className="bg-primary hover:bg-primary/90 text-white">
            <CreditCard className="w-4 h-4 mr-2" />
            Make Payment
          </Button>
          
          <Button variant="outline" onClick={() => setShowPaymentHistory(true)} className="border-slate-300 hover:bg-slate-50">
            <History className="w-4 h-4 mr-2" />
            Payment History
          </Button>
          
          {!isPatient && (
            <>
              <Button variant="outline" onClick={handleDownload} className="border-slate-300 hover:bg-slate-50">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" onClick={handlePrint} className="border-slate-300 hover:bg-slate-50">
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Sheet open={showEmailSheet} onOpenChange={setShowEmailSheet}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="border-slate-300 hover:bg-slate-50">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Send Invoice via Email</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="patient@example.com"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Dear Patient, please find your invoice attached..."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleSendEmail} className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invoice
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
              <Button variant="outline" onClick={onEdit} className="border-slate-300 hover:bg-slate-50">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              {invoice.status !== "paid" && (
                <Button 
                  variant="outline"
                  onClick={() => updateStatusMutation.mutate({ status: "paid" })}
                  disabled={updateStatusMutation.isPending}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  Mark as Paid
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Invoice Content */}
      <div id="invoice-content" className="bg-white p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <img 
              src="/attached_assets/TiNHiH-Logo_1753600277157.png" 
              alt="TiNHiH Portal" 
              className="h-12 w-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Invoice</h1>
              <p className="text-slate-600">TiNHiH Portal Healthcare</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900 mb-2">#{invoice.invoiceNumber}</div>
            {getStatusBadge(invoice.status)}
          </div>
        </div>

        {/* Bill To and Invoice Details Grid */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Bill To - Left side, centered vertically */}
          <div className="flex flex-col justify-center">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Bill To</h3>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">
                {invoice.patient?.user?.firstName && invoice.patient?.user?.lastName 
                  ? `${invoice.patient.user.firstName} ${invoice.patient.user.lastName}`
                  : invoice.patient?.user?.email 
                  ? invoice.patient.user.email
                  : 'Unknown Patient'
                }
              </p>
              <p className="text-slate-600">{invoice.patient?.user?.email || 'N/A'}</p>
              <p className="text-slate-600">{invoice.patient?.user?.phone || 'N/A'}</p>
              {invoice.patient?.address && (
                <p className="text-slate-600">{invoice.patient.address}</p>
              )}
            </div>
          </div>

          {/* Invoice Details - Right side */}
          <div className="text-right">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3 text-right">Invoice Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Invoice Number:</span>
                <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date Issued:</span>
                <span className="font-medium">{format(new Date(invoice.createdAt), "MMM dd, yyyy")}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Due Date:</span>
                  <span className="font-medium">{format(new Date(invoice.dueDate), "MMM dd, yyyy")}</span>
                </div>
              )}
              {invoice.status === "paid" && invoice.paidAt && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Paid Date:</span>
                  <span className="font-medium text-green-600">
                    {format(new Date(invoice.paidAt), "MMM dd, yyyy")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* Services Table */}
        <div className="mb-8">
          <div className="bg-slate-50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Service</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900">Units</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Price</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-slate-900">Healthcare Services</p>
                      <p className="text-sm text-slate-600 whitespace-pre-wrap mt-1">
                        {invoice.description}
                      </p>
                      {invoice.appointment && (
                        <p className="text-xs text-slate-500 mt-1">
                          Related to appointment on {format(new Date(invoice.appointment.appointmentDate), "MMM dd, yyyy")}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-900">1</td>
                  <td className="px-6 py-4 text-right text-slate-900">${Number(invoice.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900">${Number(invoice.amount || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Section */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-3">
              <div className="flex justify-between py-2">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">${Number(invoice.amount || 0).toFixed(2)}</span>
              </div>
              {Number(invoice.tax || 0) > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-slate-600">Tax:</span>
                  <span className="font-medium">${Number(invoice.tax || 0).toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between py-3">
                <span className="text-lg font-semibold text-slate-900">Total:</span>
                <span className="text-lg font-bold text-slate-900">${Number(invoice.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* FROM Section - Bottom Left */}
        <div className="mb-8">
          <div className="w-80">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">From</h3>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">
                {invoice.practitioner?.user?.firstName && invoice.practitioner?.user?.lastName 
                  ? `Dr. ${invoice.practitioner.user.firstName} ${invoice.practitioner.user.lastName}`
                  : invoice.practitioner?.user?.email 
                  ? `Dr. ${invoice.practitioner.user.email}`
                  : 'Unknown Practitioner'
                }
              </p>
              <p className="font-semibold text-slate-600">TiNHiH Portal Healthcare</p>
              <p className="text-slate-600">{invoice.practitioner?.user?.email || 'contact@tinhih.com'}</p>
              <p className="text-slate-600">{invoice.practitioner?.user?.phone || '+1-555-HEALTH'}</p>
              <p className="text-slate-600">123 Medical Center Drive</p>
              <p className="text-slate-600">Healthcare City, HC 12345</p>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        {invoice.status === "paid" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <p className="font-semibold text-green-800">Payment Received</p>
                <p className="text-green-700">
                  This invoice was paid on {format(new Date(invoice.paidAt || invoice.updatedAt), "MMM dd, yyyy 'at' h:mm a")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm border-t pt-6">
          <p>Thank you for choosing TiNHiH Portal Healthcare</p>
          <p className="mt-1">For questions about this invoice, please contact us at support@tinhih.com</p>
        </div>
      </div>

      {/* Stripe Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Secure Payment Processing
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <StripePaymentWrapper
              invoice={invoice}
              onSuccess={() => {
                setShowPaymentDialog(false);
                queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
                toast({
                  title: "Payment Successful",
                  description: "Your payment has been processed successfully.",
                });
              }}
              onCancel={() => setShowPaymentDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={showPaymentHistory} onOpenChange={setShowPaymentHistory}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Payment History
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <PaymentHistory invoiceId={invoice.id} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}