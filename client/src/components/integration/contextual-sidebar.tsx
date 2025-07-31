import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, 
  Calendar, 
  FileText, 
  CreditCard, 
  Video, 
  MessageSquare,
  Clock,
  MapPin,
  Phone,
  Mail,
  Heart,
  AlertTriangle
} from "lucide-react";
import { useIntegration } from "@/hooks/use-integration";
import { format } from "date-fns";
import { Link } from "wouter";

interface ContextualSidebarProps {
  entityType: 'patient' | 'appointment' | 'practitioner';
  entityId: string;
  className?: string;
}

export function ContextualSidebar({ entityType, entityId, className }: ContextualSidebarProps) {
  const { useContextualData } = useIntegration();
  const { data: contextData, isLoading } = useContextualData(entityType, entityId);

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!contextData) return null;

  if (entityType === 'patient') {
    const patient = contextData.patient;
    const recentAppointments = contextData.recentAppointments || [];
    const activeInvoices = contextData.activeInvoices || [];
    const clinicalSummary = contextData.clinicalSummary || {};

    return (
      <div className={`space-y-4 ${className}`}>
        {/* Patient Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{patient?.user?.phone || 'No phone'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{patient?.user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{patient?.address || 'No address'}</span>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Insurance</div>
              <div className="text-sm text-muted-foreground">
                {patient?.insuranceProvider || 'No insurance on file'}
              </div>
              {patient?.insuranceNumber && (
                <div className="text-xs text-muted-foreground">
                  #{patient.insuranceNumber}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medical Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Medical Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patient?.allergies && patient.allergies.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">Allergies</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.map((allergy: string, index: number) => (
                    <Badge key={index} variant="destructive" className="text-xs">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {patient?.medications && patient.medications.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Current Medications</div>
                <div className="space-y-1">
                  {patient.medications.slice(0, 3).map((medication: string, index: number) => (
                    <div key={index} className="text-xs bg-muted p-2 rounded">
                      {medication}
                    </div>
                  ))}
                  {patient.medications.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{patient.medications.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {recentAppointments.map((appointment: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded border">
                    <Calendar className="w-4 h-4 mt-1 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {appointment.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(appointment.appointmentDate), 'MMM d, yyyy')}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                
                {activeInvoices.map((invoice: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded border">
                    <CreditCard className="w-4 h-4 mt-1 text-green-600" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        Invoice #{invoice.invoiceNumber}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ${invoice.amount}
                      </div>
                      <Badge 
                        variant={invoice.status === 'paid' ? 'default' : 'destructive'} 
                        className="text-xs mt-1"
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href={`/appointments?patient=${entityId}`}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                All Appointments
              </Button>
            </Link>
            
            <Link href={`/clinical-notes?patient=${entityId}`}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Clinical Notes
              </Button>
            </Link>
            
            <Link href={`/billing?patient=${entityId}`}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <CreditCard className="w-4 h-4 mr-2" />
                Billing History
              </Button>
            </Link>
            
            <Link href={`/messages?recipient=${patient?.userId}`}>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}