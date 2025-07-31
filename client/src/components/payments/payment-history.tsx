import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, 
  Calendar, 
  DollarSign,
  Receipt,
  Download,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface PaymentHistoryProps {
  patientId?: string;
  invoiceId?: string;
}

export function PaymentHistory({ patientId, invoiceId }: PaymentHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  // Fetch payment history
  const handleDownloadReceipt = (payment: any) => {
    // Generate receipt HTML
    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
          .receipt { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          .logo { width: 60px; height: 60px; margin: 0 auto 16px; }
          .title { color: #1e293b; font-size: 24px; font-weight: 600; margin: 0; }
          .subtitle { color: #64748b; font-size: 16px; margin: 8px 0 0; }
          .section { margin: 24px 0; }
          .section-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
          .detail-label { color: #64748b; }
          .detail-value { color: #1e293b; font-weight: 500; }
          .amount { font-size: 20px; font-weight: 600; color: #059669; }
          .success { background: #ecfdf5; color: #065f46; padding: 12px; border-radius: 6px; text-align: center; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">
              <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="50" fill="#fbbf24"/>
                <text x="50" y="60" text-anchor="middle" fill="white" font-size="32" font-weight="bold">T</text>
              </svg>
            </div>
            <h1 class="title">Payment Receipt</h1>
            <p class="subtitle">TiNHiH Foundation Healthcare</p>
          </div>

          <div class="success">
            ✓ Payment Successful
          </div>

          <div class="section">
            <div class="section-title">Payment Details</div>
            <div class="detail-row">
              <span class="detail-label">Payment ID:</span>
              <span class="detail-value">${payment.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value amount">$${(payment.amount / 100).toFixed(2)} ${payment.currency.toUpperCase()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span class="detail-value">${new Date(payment.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${payment.payment_method?.type || 'Card'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">Completed</span>
            </div>
          </div>

          ${payment.invoice ? `
          <div class="section">
            <div class="section-title">Invoice Information</div>
            <div class="detail-row">
              <span class="detail-label">Invoice Number:</span>
              <span class="detail-value">${payment.invoice.invoiceNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Description:</span>
              <span class="detail-value">${payment.invoice.description || 'Healthcare Services'}</span>
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>Thank you for your payment!</strong></p>
            <p>For questions about this receipt, contact us at support@tinhih.com</p>
            <p>TiNHiH Foundation Healthcare • 123 Medical Center Drive • Healthcare City, HC 12345</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create and download receipt
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${payment.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const { data: payments = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/payments', { patientId, invoiceId, search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      if (invoiceId) params.append('invoiceId', invoiceId);
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/payments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case "processing":
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
      case "refunded":
        return <Badge className="bg-orange-100 text-orange-800"><RefreshCw className="w-3 h-3 mr-1" />Refunded</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  const getPaymentMethodInfo = (paymentMethod: any) => {
    if (!paymentMethod) return { icon: CreditCard, text: "Unknown" };
    
    switch (paymentMethod.type) {
      case "card":
        return {
          icon: CreditCard,
          text: `•••• •••• •••• ${paymentMethod.card?.last4 || "****"} (${paymentMethod.card?.brand?.toUpperCase() || "CARD"})`
        };
      case "apple_pay":
        return {
          icon: CreditCard,
          text: "Apple Pay"
        };
      case "google_pay":
        return {
          icon: CreditCard,
          text: "Google Pay"
        };
      default:
        return {
          icon: CreditCard,
          text: paymentMethod.type || "Card"
        };
    }
  };

  const calculateTotals = () => {
    const completedPayments = payments.filter((p: any) => p.status === "succeeded");
    const totalAmount = completedPayments.reduce((sum: number, p: any) => sum + (p.amount / 100), 0);
    const totalRefunded = payments
      .filter((p: any) => p.status === "refunded")
      .reduce((sum: number, p: any) => sum + (p.refunded_amount / 100 || 0), 0);
    
    return {
      totalPayments: completedPayments.length,
      totalAmount,
      totalRefunded,
      netAmount: totalAmount - totalRefunded
    };
  };

  const totals = calculateTotals();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Total Payments</p>
                <p className="text-2xl font-bold">{totals.totalPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Total Amount</p>
                <p className="text-2xl font-bold">${totals.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Refunded</p>
                <p className="text-2xl font-bold">${totals.totalRefunded.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Net Amount</p>
                <p className="text-2xl font-bold">${totals.netAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>View all payment transactions and their details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by invoice number, patient name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="succeeded">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Payment List */}
          <div className="space-y-4">
            {payments.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No payment history found</p>
              </div>
            ) : (
              payments.map((payment: any) => {
                const paymentMethodInfo = getPaymentMethodInfo(payment.payment_method);
                const PaymentIcon = paymentMethodInfo.icon;
                
                return (
                  <Card key={payment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
                            <PaymentIcon className="w-5 h-5 text-primary" />
                          </div>
                          
                          <div>
                            <p className="font-medium">
                              Payment for Invoice #{payment.invoice?.invoiceNumber || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {paymentMethodInfo.text}
                            </p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(payment.created_at), "MMM dd, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            ${(payment.amount / 100).toFixed(2)}
                          </p>
                          {getStatusBadge(payment.status)}
                          
                          {payment.status === "succeeded" && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => handleDownloadReceipt(payment)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Receipt
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {payment.failure_message && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-sm text-red-700">
                            <XCircle className="w-4 h-4 inline mr-1" />
                            {payment.failure_message}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}