import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Download, Eye, Calendar, DollarSign, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { StripePaymentWrapper } from '@/components/payments/payment-form';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

export default function PatientBilling() {
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['/api/patient/invoices'],
  });

  const { data: paymentHistory } = useQuery({
    queryKey: ['/api/patient/payment-history'],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const unpaidInvoices = invoices?.filter((inv: any) => inv.status !== 'paid') || [];
  const paidInvoices = invoices?.filter((inv: any) => inv.status === 'paid') || [];
  const totalOwed = unpaidInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Billing & Payments</h2>
        <p className="text-muted-foreground">Manage your medical bills and payment history</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">${totalOwed.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Outstanding Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Receipt className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{unpaidInvoices.length}</p>
                <p className="text-sm text-muted-foreground">Unpaid Bills</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{paymentHistory?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Payments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Bills */}
      {unpaidInvoices.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Outstanding Bills</h3>
          {unpaidInvoices.map((invoice: any) => (
            <Card key={invoice.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">Invoice #{invoice.invoiceNumber}</h4>
                      <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date: {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                      </div>
                      {invoice.dueDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Amount: ${Number(invoice.total).toFixed(2)}
                      </div>
                      {invoice.description && (
                        <p className="mt-2">{invoice.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Invoice #{invoice.invoiceNumber}</DialogTitle>
                          <DialogDescription>
                            Invoice details and breakdown
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Invoice Date:</strong> {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
                            </div>
                            <div>
                              <strong>Due Date:</strong> {invoice.dueDate ? format(new Date(invoice.dueDate), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                            <div>
                              <strong>Status:</strong> {invoice.status}
                            </div>
                            <div>
                              <strong>Amount:</strong> ${Number(invoice.total).toFixed(2)}
                            </div>
                          </div>
                          {invoice.description && (
                            <div>
                              <strong>Description:</strong>
                              <p className="mt-1">{invoice.description}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90"
                          onClick={() => setSelectedInvoice(invoice)}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Make Payment</DialogTitle>
                          <DialogDescription>
                            Pay for Invoice #{selectedInvoice?.invoiceNumber}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedInvoice && (
                          <StripePaymentWrapper
                            invoice={selectedInvoice}
                            onSuccess={() => {
                              setShowPaymentModal(false);
                              setSelectedInvoice(null);
                            }}
                            onCancel={() => {
                              setShowPaymentModal(false);
                              setSelectedInvoice(null);
                            }}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Payment History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Payment History</h3>
        {paidInvoices.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No payment history available</p>
            </CardContent>
          </Card>
        ) : (
          paidInvoices.map((invoice: any) => (
            <Card key={invoice.id} className="opacity-75">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Receipt className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Invoice #{invoice.invoiceNumber}</h4>
                      <p className="text-sm text-muted-foreground">
                        Paid on {invoice.paidAt ? format(new Date(invoice.paidAt), 'MMM dd, yyyy') : 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">${Number(invoice.total).toFixed(2)}</span>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Receipt
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* No Outstanding Bills Message */}
      {unpaidInvoices.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">You have no outstanding bills at this time.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}