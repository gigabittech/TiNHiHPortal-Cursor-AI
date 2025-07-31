import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Info, 
  CreditCard, 
  DollarSign,
  Shield,
  CheckCircle
} from "lucide-react";

export function DemoPaymentNotice() {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-900">Demo Payment System</h3>
              <p className="text-sm text-blue-800">
                This is a demonstration of the Stripe payment integration. In demo mode, you can test the payment flow using test card numbers.
              </p>
            </div>
          </div>

          <div className="bg-blue-100 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-blue-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Test Card Numbers
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">Successful Payment:</span>
                  <code className="bg-white px-2 py-1 rounded text-blue-900">4242 4242 4242 4242</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Declined Card:</span>
                  <code className="bg-white px-2 py-1 rounded text-blue-900">4000 0000 0000 0002</code>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-blue-700">3D Secure:</span>
                  <code className="bg-white px-2 py-1 rounded text-blue-900">4000 0025 0000 3155</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Expiry:</span>
                  <code className="bg-white px-2 py-1 rounded text-blue-900">Any future date</code>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-blue-200">
              <p className="text-xs text-blue-600">
                Use any 3-digit CVC and any billing zip code. These test numbers won't charge real money.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              HIPAA Compliant
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Shield className="w-3 h-3 mr-1" />
              PCI DSS Level 1
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              <DollarSign className="w-3 h-3 mr-1" />
              Multi-Currency
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}