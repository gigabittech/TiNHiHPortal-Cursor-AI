import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CalendarPlus, 
  FileText, 
  Video, 
  CreditCard, 
  MessageSquare,
  Clock,
  User,
  Stethoscope,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useIntegration } from "@/hooks/use-integration";
import { Link } from "wouter";

interface QuickActionsProps {
  context: 'patient' | 'appointment' | 'dashboard';
  data?: any;
}

export function QuickActions({ context, data }: QuickActionsProps) {
  const { user } = useAuth();
  const { useQuickActions } = useIntegration();
  const quickActions = useQuickActions();

  if (context === 'patient' && data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Quick Actions for {data.user?.firstName} {data.user?.lastName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/calendar?patient=${data.id}`}>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <CalendarPlus className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            </Link>
            
            <Link href={`/clinical-notes?patient=${data.id}`}>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </Link>
            
            <Link href={`/telehealth?patient=${data.id}`}>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Video className="w-4 h-4 mr-2" />
                Start Video
              </Button>
            </Link>
            
            <Link href={`/billing?patient=${data.id}`}>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <CreditCard className="w-4 h-4 mr-2" />
                Billing
              </Button>
            </Link>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Recent Activity</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Last Appointment</span>
                <Badge variant="outline">2 days ago</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Outstanding Balance</span>
                <Badge variant={data.outstandingBalance > 0 ? "destructive" : "secondary"}>
                  ${data.outstandingBalance || '0.00'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (context === 'appointment' && data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" />
            Appointment Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status</span>
            <Badge variant={
              data.status === 'completed' ? 'default' : 
              data.status === 'in_progress' ? 'secondary' : 
              data.status === 'cancelled' ? 'destructive' : 
              'outline'
            }>
              {data.status}
            </Badge>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            {data.status === 'scheduled' && (
              <>
                {data.type === 'telehealth' && (
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => quickActions.startTelehealthSession.mutate(data.id)}
                    disabled={quickActions.startTelehealthSession.isPending}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Start Session
                  </Button>
                )}
                
                <Link href={`/clinical-notes/new?appointment=${data.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    Prepare Notes
                  </Button>
                </Link>
              </>
            )}
            
            {data.status === 'in_progress' && (
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => quickActions.generateInvoiceFromAppointment.mutate(data)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Generate Invoice
              </Button>
            )}
            
            {data.status === 'completed' && (
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/clinical-notes?appointment=${data.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="w-4 h-4 mr-2" />
                    View Notes
                  </Button>
                </Link>
                
                <Link href={`/billing?appointment=${data.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <CreditCard className="w-4 h-4 mr-2" />
                    View Invoice
                  </Button>
                </Link>
              </div>
            )}
          </div>
          
          <Separator />
          
          <Link href={`/messages?recipient=${data.patientId}`}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Patient
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (context === 'dashboard') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Link href="/calendar">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <CalendarPlus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </Link>
            
            <Link href="/patients">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <User className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </Link>
            
            <Link href="/clinical-notes">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FileText className="w-4 h-4 mr-2" />
                Clinical Notes
              </Button>
            </Link>
            
            <Link href="/telehealth">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Video className="w-4 h-4 mr-2" />
                Start Session
              </Button>
            </Link>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Today's Priority</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm">Pending Notes</span>
                </div>
                <Badge variant="secondary">3</Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span className="text-sm">Unpaid Invoices</span>
                </div>
                <Badge variant="destructive">2</Badge>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <Link href="/messages">
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <MessageSquare className="w-4 h-4 mr-2" />
              Check Messages
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return null;
}