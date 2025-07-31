import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Clock,
  DollarSign,
  Receipt,
  Smartphone,
  Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DemoPaymentNotice } from "./demo-payment-notice";

// Load Stripe outside of component to avoid recreating on every render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface PaymentFormProps {
  invoice: any;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PaymentFormProps {
  invoice: any;
  onSuccess: () => void;
  onCancel: () => void;
}

// Main payment form component
function PaymentForm({ invoice, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/billing`,
        },
        redirect: 'if_required'
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Payment succeeded - update invoice status
        try {
          await apiRequest(`/api/invoices/${invoice.id}`, 'PUT', {
            status: 'paid',
            paidAt: new Date().toISOString(),
          });
          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
          queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
        } catch (error) {
          console.error('Failed to update invoice status:', error);
        }

        toast({
          title: "Payment Successful",
          description: "Your payment has been processed successfully.",
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Demo Notice */}
      <DemoPaymentNotice />
      
      {/* Invoice Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Invoice Number:</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Patient:</span>
              <span className="font-medium">
                {invoice.patient?.user?.firstName} {invoice.patient?.user?.lastName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Description:</span>
              <span className="font-medium">{invoice.description || "Healthcare Services"}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-primary">${Number(invoice.total).toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Method
          </CardTitle>
          <CardDescription>
            Choose your preferred payment method. All transactions are secure and encrypted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stripe Payment Element */}
            <div className="space-y-2">
              <Label>Payment Details</Label>
              <div className="border rounded-lg p-4">
                <PaymentElement 
                  options={{
                    layout: 'tabs',
                    paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
                  }}
                />
              </div>
            </div>

            {/* Payment Note */}
            <div className="space-y-2">
              <Label htmlFor="payment-note">Payment Note (Optional)</Label>
              <Textarea
                id="payment-note"
                placeholder="Add any notes about this payment..."
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            {/* Security Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">Secure Payment Processing</p>
                  <p className="text-xs text-blue-700">
                    Your payment information is encrypted and processed securely through Stripe. 
                    We never store your card details on our servers.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={!stripe || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Confirm Payment - ${Number(invoice.total).toFixed(2)}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Payment Methods Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Accepted Payment Methods</h4>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Credit & Debit Cards</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                <span>Apple Pay</span>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span>Google Pay</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StripePaymentWrapperProps {
  invoice: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StripePaymentWrapper({ invoice, onSuccess, onCancel }: StripePaymentWrapperProps) {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Create payment intent when component mounts (when modal opens)
    const createPaymentIntent = async () => {
      try {
        const response = await apiRequest('/api/payments/create-intent', 'POST', {
          invoiceId: invoice.id,
          amount: Number(invoice.total) * 100, // Convert to cents
          currency: 'usd'
        });

        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('Failed to create payment intent');
        }
      } catch (error: any) {
        setError(error.message || 'Failed to initialize payment');
        toast({
          title: "Payment Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [invoice.id, invoice.total, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Initializing payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <XCircle className="w-8 h-8 mx-auto mb-2" />
          <p className="font-medium">Payment initialization failed</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={onCancel} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">Setting up payment...</p>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm 
        invoice={invoice} 
        onSuccess={onSuccess} 
        onCancel={onCancel} 
      />
    </Elements>
  );
}