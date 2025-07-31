import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign, Search, Edit, Eye, CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { InvoiceForm } from "./invoice-form";
import { InvoiceDetailView } from "./invoice-detail-view";

interface InvoiceListProps {
  onNewInvoice: () => void;
}

export function InvoiceList({ onNewInvoice }: InvoiceListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch invoices with proper search and filtering
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/invoices", searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm && searchTerm.trim()) params.append("search", searchTerm.trim());
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      params.append("limit", "50");
      
      const url = params.toString() ? `/api/invoices?${params.toString()}` : "/api/invoices?limit=50";
      const response = await api.get(url);
      return Array.isArray(response) ? response : [];
    },
  });

  const handleNewInvoice = () => {
    setEditingInvoice(null);
    setShowForm(true);
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleViewInvoice = (invoice: any) => {
    setViewingInvoice(invoice);
  };

  const handleCloseDetailView = () => {
    setViewingInvoice(null);
  };

  const handleEditFromDetail = () => {
    setEditingInvoice(viewingInvoice);
    setViewingInvoice(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingInvoice(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingInvoice(null);
  };

  // Update invoice status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ invoiceId, status }: { invoiceId: string; status: string }) => {
      return api.put(`/api/invoices/${invoiceId}`, { 
        status,
        ...(status === "paid" && { paidAt: new Date().toISOString() })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.refetchQueries({ queryKey: ["/api/invoices"] });
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

  const calculateTotals = () => {
    if (!invoices) return { total: 0, paid: 0, outstanding: 0 };
    
    const total = invoices.reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
    const paid = invoices.filter((inv: any) => inv.status === "paid").reduce((sum: number, inv: any) => sum + Number(inv.total || 0), 0);
    const outstanding = total - paid;
    
    return { total, paid, outstanding };
  };

  const totals = calculateTotals();

  if (viewingInvoice) {
    return (
      <InvoiceDetailView
        invoice={viewingInvoice}
        onEdit={handleEditFromDetail}
        onClose={handleCloseDetailView}
      />
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleFormCancel}>
            ← Back to Invoices
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{editingInvoice ? "Edit Invoice" : "New Invoice"}</h2>
            <p className="text-sm text-slate-600">
              {editingInvoice ? "Update invoice details" : "Create a new invoice for services"}
            </p>
          </div>
        </div>
        
        <InvoiceForm
          invoice={editingInvoice}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                <p className="text-2xl font-bold text-slate-900">${totals.total.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Paid</p>
                <p className="text-2xl font-bold text-green-600">${totals.paid.toFixed(2)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">${totals.outstanding.toFixed(2)}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Invoice List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoices</CardTitle>
            <Button onClick={handleNewInvoice}>
              <Plus className="w-4 h-4 mr-2" />
              New Invoice
            </Button>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="text-slate-600 mt-2">Loading invoices...</p>
            </div>
          ) : !invoices || invoices.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No invoices yet</h3>
              <p className="text-slate-600 mb-4">Start creating invoices for your services</p>
              <Button onClick={handleNewInvoice}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Invoice
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice: any) => (
                <div key={invoice.id} className="border rounded-lg p-4 hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-slate-900">#{invoice.invoiceNumber}</h3>
                        {getStatusBadge(invoice.status)}
                      </div>
                      
                      <div className="text-sm text-slate-600 mb-2">
                        <span className="font-medium">Patient:</span> {invoice.patient?.user ? `${invoice.patient.user.firstName} ${invoice.patient.user.lastName}` : 'Unknown Patient'}
                        <span className="mx-2">•</span>
                        <span className="font-medium">Amount:</span> ${Number(invoice.total || 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-500 mb-2">
                        <span className="font-medium">Practitioner:</span> {invoice.practitioner?.user ? `Dr. ${invoice.practitioner.user.firstName} ${invoice.practitioner.user.lastName}` : 'Unknown Practitioner'}
                      </div>
                      
                      <div className="text-sm text-slate-500 mb-2">
                        Created: {format(new Date(invoice.createdAt), "MMM dd, yyyy")}
                        {invoice.dueDate && (
                          <>
                            <span className="mx-2">•</span>
                            Due: {format(new Date(invoice.dueDate), "MMM dd, yyyy")}
                          </>
                        )}
                      </div>
                      
                      {invoice.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {invoice.description.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditInvoice(invoice)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {invoice.status !== "paid" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ 
                            invoiceId: invoice.id, 
                            status: "paid" 
                          })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}