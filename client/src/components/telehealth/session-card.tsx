import { Calendar, Clock, ExternalLink, Play, Phone, PhoneOff, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { TelehealthSessionWithDetails } from "@shared/schema";

interface TelehealthSessionCardProps {
  session: TelehealthSessionWithDetails;
  onJoin: (isPatient: boolean) => void;
  onStart: () => void;
  onEnd: () => void;
  getPlatformIcon: (platform: string) => React.ReactNode;
  getStatusColor: (status: string) => string;
  isReadOnly?: boolean;
}

export function TelehealthSessionCard({
  session,
  onJoin,
  onStart,
  onEnd,
  getPlatformIcon,
  getStatusColor,
  isReadOnly = false,
}: TelehealthSessionCardProps) {
  const formatDateTime = (date: string | Date) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString(),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const appointmentDateTime = formatDateTime(session.appointment.appointmentDate);
  const canJoin = ['scheduled', 'waiting_room', 'in_session'].includes(session.status);
  const canStart = session.status === 'scheduled';
  const canEnd = session.status === 'in_session';

  const openMeetingUrl = () => {
    if (session.meetingUrl) {
      window.open(session.meetingUrl, '_blank');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              {getPlatformIcon(session.platform)}
            </div>
            <div>
              <CardTitle className="text-lg">
                {session.patient.user.firstName} {session.patient.user.lastName}
              </CardTitle>
              <p className="text-sm text-gray-600">
                with Dr. {session.practitioner.user.firstName} {session.practitioner.user.lastName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge className={getStatusColor(session.status)}>
              {session.status.replace('_', ' ').toUpperCase()}
            </Badge>
            
            {!isReadOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {session.meetingUrl && (
                    <DropdownMenuItem onClick={openMeetingUrl}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Meeting
                    </DropdownMenuItem>
                  )}
                  {canStart && (
                    <DropdownMenuItem onClick={onStart}>
                      <Play className="w-4 h-4 mr-2" />
                      Start Session
                    </DropdownMenuItem>
                  )}
                  {canEnd && (
                    <DropdownMenuItem onClick={onEnd}>
                      <PhoneOff className="w-4 h-4 mr-2" />
                      End Session
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{appointmentDateTime.date}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{appointmentDateTime.time}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {getPlatformIcon(session.platform)}
            <span className="capitalize">{session.platform.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Meeting Details */}
        {session.meetingId && (
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <h4 className="font-medium text-sm mb-2">Meeting Details</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Meeting ID:</span>
                <span className="font-mono">{session.meetingId}</span>
              </div>
              {session.passcode && (
                <div className="flex justify-between">
                  <span>Passcode:</span>
                  <span className="font-mono">{session.passcode}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session Notes */}
        {session.sessionNotes && (
          <div className="mb-4">
            <h4 className="font-medium text-sm mb-1">Session Notes</h4>
            <p className="text-sm text-gray-600">{session.sessionNotes}</p>
          </div>
        )}

        {/* Session Timing */}
        {(session.sessionStartedAt || session.sessionEndedAt) && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <h4 className="font-medium text-sm mb-2">Session Timing</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {session.sessionStartedAt && (
                <div className="flex justify-between">
                  <span>Started:</span>
                  <span>{formatDateTime(session.sessionStartedAt).time}</span>
                </div>
              )}
              {session.sessionEndedAt && (
                <div className="flex justify-between">
                  <span>Ended:</span>
                  <span>{formatDateTime(session.sessionEndedAt).time}</span>
                </div>
              )}
              {session.sessionStartedAt && session.sessionEndedAt && (
                <div className="flex justify-between font-medium">
                  <span>Duration:</span>
                  <span>
                    {Math.round(
                      (new Date(session.sessionEndedAt).getTime() - 
                       new Date(session.sessionStartedAt).getTime()) / (1000 * 60)
                    )} minutes
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical Issues */}
        {session.technicalIssues && (
          <div className="bg-orange-50 p-3 rounded-lg mb-4">
            <h4 className="font-medium text-sm mb-1 text-orange-800">Technical Issues</h4>
            <p className="text-sm text-orange-700">{session.technicalIssues}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!isReadOnly && canJoin && (
          <div className="flex flex-wrap gap-2">
            {canStart && (
              <Button
                onClick={onStart}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Session
              </Button>
            )}
            
            <Button
              onClick={() => onJoin(false)}
              variant="outline"
              size="sm"
            >
              <Phone className="w-4 h-4 mr-2" />
              Join as Provider
            </Button>
            
            <Button
              onClick={() => onJoin(true)}
              variant="outline"
              size="sm"
            >
              <Phone className="w-4 h-4 mr-2" />
              Join as Patient
            </Button>

            {session.meetingUrl && (
              <Button
                onClick={openMeetingUrl}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Meeting
              </Button>
            )}

            {canEnd && (
              <Button
                onClick={onEnd}
                variant="destructive"
                size="sm"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Session
              </Button>
            )}
          </div>
        )}
        
        {/* Recording Link */}
        {session.recordingUrl && (
          <div className="mt-4 pt-4 border-t">
            <Button
              onClick={() => window.open(session.recordingUrl!, '_blank')}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Recording
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}