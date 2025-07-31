import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  FileText, 
  CreditCard, 
  Video, 
  MessageSquare,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { useIntegration } from "@/hooks/use-integration";
import { Link } from "wouter";

interface PatientTimelineProps {
  patientId: string;
  className?: string;
}

export function PatientTimeline({ patientId, className }: PatientTimelineProps) {
  const { usePatientTimeline } = useIntegration();
  const { data: timeline, isLoading } = usePatientTimeline(patientId);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Patient Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-muted h-8 w-8"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Patient Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No timeline data available yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'clinical_note':
        return <FileText className="w-4 h-4" />;
      case 'invoice':
        return <CreditCard className="w-4 h-4" />;
      case 'telehealth':
        return <Video className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTimelineColor = (type: string, status?: string) => {
    switch (type) {
      case 'appointment':
        if (status === 'completed') return 'text-green-600 bg-green-100';
        if (status === 'cancelled') return 'text-red-600 bg-red-100';
        return 'text-blue-600 bg-blue-100';
      case 'clinical_note':
        return 'text-purple-600 bg-purple-100';
      case 'invoice':
        if (status === 'paid') return 'text-green-600 bg-green-100';
        if (status === 'overdue') return 'text-red-600 bg-red-100';
        return 'text-orange-600 bg-orange-100';
      case 'telehealth':
        return 'text-indigo-600 bg-indigo-100';
      case 'message':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (type: string, status?: string) => {
    if (type === 'appointment') {
      if (status === 'completed') return <CheckCircle className="w-3 h-3 text-green-600" />;
      if (status === 'cancelled') return <XCircle className="w-3 h-3 text-red-600" />;
      if (status === 'scheduled') return <AlertCircle className="w-3 h-3 text-blue-600" />;
    }
    if (type === 'invoice') {
      if (status === 'paid') return <CheckCircle className="w-3 h-3 text-green-600" />;
      if (status === 'overdue') return <XCircle className="w-3 h-3 text-red-600" />;
    }
    return null;
  };

  const getTimelineTitle = (item: any) => {
    switch (item.type) {
      case 'appointment':
        return item.title || 'Appointment';
      case 'clinical_note':
        return 'Clinical Note';
      case 'invoice':
        return `Invoice #${item.invoiceNumber || 'N/A'}`;
      case 'telehealth':
        return 'Telehealth Session';
      case 'message':
        return item.subject || 'Message';
      default:
        return 'Timeline Item';
    }
  };

  const getTimelineDescription = (item: any) => {
    switch (item.type) {
      case 'appointment':
        return item.description || `${item.duration || 30} minute appointment`;
      case 'clinical_note':
        return item.assessment || 'Clinical documentation';
      case 'invoice':
        return `$${item.amount || '0.00'} - ${item.status || 'pending'}`;
      case 'telehealth':
        return `${item.platform || 'Video'} session - ${item.status || 'scheduled'}`;
      case 'message':
        return item.content?.substring(0, 100) + (item.content?.length > 100 ? '...' : '');
      default:
        return '';
    }
  };

  const getTimelineLink = (item: any) => {
    switch (item.type) {
      case 'appointment':
        return `/calendar?appointment=${item.id}`;
      case 'clinical_note':
        return `/clinical-notes?note=${item.id}`;
      case 'invoice':
        return `/billing?invoice=${item.id}`;
      case 'telehealth':
        return `/telehealth?session=${item.id}`;
      case 'message':
        return `/messages?message=${item.id}`;
      default:
        return '#';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Patient Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {timeline.map((item: any, index: number) => (
              <div key={`${item.type}-${item.id}-${index}`} className="flex space-x-4">
                {/* Timeline Icon */}
                <div className={`rounded-full p-2 ${getTimelineColor(item.type, item.status)}`}>
                  {getTimelineIcon(item.type)}
                </div>
                
                {/* Timeline Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Link href={getTimelineLink(item)}>
                        <div className="flex items-center gap-2 hover:text-primary cursor-pointer">
                          <h4 className="text-sm font-medium">
                            {getTimelineTitle(item)}
                          </h4>
                          {getStatusIcon(item.type, item.status)}
                        </div>
                      </Link>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {getTimelineDescription(item)}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.date), 'MMM d, yyyy h:mm a')}
                        </span>
                        
                        {item.status && (
                          <Badge variant="outline" className="text-xs">
                            {item.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {index < timeline.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {/* View All Button */}
        <div className="mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full">
            View Complete History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}