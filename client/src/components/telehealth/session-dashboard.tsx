import { useState } from "react";
import { ThemedCard, ThemedCardContent, ThemedCardHeader, ThemedCardTitle } from "@/components/ui/themed-card";
import { ThemedButton } from "@/components/ui/themed-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Video, 
  Calendar, 
  Clock, 
  Users, 
  Activity,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Phone,
  Monitor,
  Smartphone
} from "lucide-react";
import type { TelehealthSessionWithDetails } from "@shared/schema";

interface SessionDashboardProps {
  sessions: TelehealthSessionWithDetails[];
  onJoinSession: (session: TelehealthSessionWithDetails, isPatient?: boolean) => void;
  onStartSession: (id: string) => void;
  onEndSession: (id: string) => void;
}

export function SessionDashboard({
  sessions,
  onJoinSession,
  onStartSession,
  onEndSession
}: SessionDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("today");

  const todaySessions = sessions.filter(s => {
    if (!s.appointment) return false;
    const sessionDate = new Date(s.appointment.dateTime);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  });

  const upcomingSessions = sessions.filter(s => {
    if (!s.appointment) return s.status === 'scheduled'; // Show sessions without appointments if scheduled
    const sessionDate = new Date(s.appointment.dateTime);
    const today = new Date();
    return sessionDate > today;
  });

  const completedSessions = sessions.filter(s => s.status === 'completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'waiting_room': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in_session': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zoom': return <Video className="w-4 h-4" />;
      case 'teams': return <Users className="w-4 h-4" />;
      case 'google_meet': return <Monitor className="w-4 h-4" />;
      case 'webrtc': return <Smartphone className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const SessionCard = ({ session }: { session: TelehealthSessionWithDetails }) => (
    <ThemedCard className="mb-4">
      <ThemedCardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex items-center space-x-2">
                {getPlatformIcon(session.platform || 'webrtc')}
                <span className="font-semibold">
                  {session.patient?.user?.firstName} {session.patient?.user?.lastName}
                </span>
              </div>
              <Badge className={getStatusColor(session.status)}>
                {session.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4" style={{ color: `hsl(var(--muted-foreground))` }} />
                <span>{session.appointment ? new Date(session.appointment.dateTime).toLocaleDateString() : new Date(session.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4" style={{ color: `hsl(var(--muted-foreground))` }} />
                <span>{session.appointment ? new Date(session.appointment.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Direct Session'}</span>
              </div>
            </div>

            {session.platform && (
              <div className="mb-3">
                <span className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Platform: {session.platform.toUpperCase()}
                </span>
              </div>
            )}

            {session.sessionNotes && (
              <div className="mb-4">
                <p className="text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                  {session.sessionNotes}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            {session.status === 'scheduled' && (
              <>
                <ThemedButton
                  onClick={() => onStartSession(session.id)}
                  size="sm"
                  className="min-w-[120px]"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Session
                </ThemedButton>
                <ThemedButton
                  onClick={() => onJoinSession(session, false)}
                  variant="outline"
                  size="sm"
                  className="min-w-[120px]"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Join as Provider
                </ThemedButton>
                <ThemedButton
                  onClick={() => onJoinSession(session, true)}
                  variant="outline"
                  size="sm"
                  className="min-w-[120px]"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Join as Patient
                </ThemedButton>
              </>
            )}

            {session.status === 'waiting_room' && (
              <>
                <ThemedButton
                  onClick={() => onJoinSession(session, false)}
                  size="sm"
                  className="min-w-[120px]"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Join Call
                </ThemedButton>
                {session.meetingUrl && (
                  <ThemedButton
                    onClick={() => {
                      navigator.clipboard.writeText(session.meetingUrl!);
                      const toast = document.createElement('div');
                      toast.textContent = 'Meeting link copied to clipboard!';
                      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    }}
                    variant="outline"
                    size="sm"
                    className="min-w-[120px]"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Copy Link
                  </ThemedButton>
                )}
              </>
            )}

            {session.status === 'in_session' && (
              <>
                <ThemedButton
                  onClick={() => onJoinSession(session, false)}
                  size="sm"
                  className="min-w-[120px]"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Rejoin Session
                </ThemedButton>
                <ThemedButton
                  onClick={() => onEndSession(session.id)}
                  variant="destructive"
                  size="sm"
                  className="min-w-[120px]"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  End Session
                </ThemedButton>
                {session.meetingUrl && (
                  <ThemedButton
                    onClick={() => {
                      navigator.clipboard.writeText(session.meetingUrl!);
                      const toast = document.createElement('div');
                      toast.textContent = 'Meeting link copied!';
                      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    }}
                    variant="outline"
                    size="sm"
                    className="min-w-[120px]"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Copy Link
                  </ThemedButton>
                )}
              </>
            )}

            {session.status === 'completed' && (
              <div className="text-sm text-center py-2" style={{ color: `hsl(var(--muted-foreground))` }}>
                Session Completed
              </div>
            )}
          </div>
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ThemedCard>
          <ThemedCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Today's Sessions
                </p>
                <p className="text-2xl font-bold" style={{ color: `hsl(var(--foreground))` }}>
                  {todaySessions.length}
                </p>
              </div>
              <Calendar className="w-8 h-8" style={{ color: `hsl(var(--primary))` }} />
            </div>
          </ThemedCardContent>
        </ThemedCard>

        <ThemedCard>
          <ThemedCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Active Now
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {sessions.filter(s => s.status === 'in_session').length}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </ThemedCardContent>
        </ThemedCard>

        <ThemedCard>
          <ThemedCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Completed
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {completedSessions.length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </ThemedCardContent>
        </ThemedCard>

        <ThemedCard>
          <ThemedCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: `hsl(var(--muted-foreground))` }}>
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-purple-600">98%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </ThemedCardContent>
        </ThemedCard>
      </div>

      {/* Session Tabs */}
      <ThemedCard>
        <ThemedCardHeader>
          <ThemedCardTitle>Telehealth Sessions</ThemedCardTitle>
        </ThemedCardHeader>
        <ThemedCardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="today">Today ({todaySessions.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingSessions.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedSessions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-6">
              {todaySessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: `hsl(var(--muted-foreground))` }} />
                  <h3 className="text-lg font-medium mb-2" style={{ color: `hsl(var(--foreground))` }}>
                    No sessions today
                  </h3>
                  <p style={{ color: `hsl(var(--muted-foreground))` }}>
                    Schedule a telehealth session to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaySessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="mt-6">
              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: `hsl(var(--muted-foreground))` }} />
                  <h3 className="text-lg font-medium mb-2" style={{ color: `hsl(var(--foreground))` }}>
                    No upcoming sessions
                  </h3>
                  <p style={{ color: `hsl(var(--muted-foreground))` }}>
                    Your future sessions will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
              {completedSessions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: `hsl(var(--muted-foreground))` }} />
                  <h3 className="text-lg font-medium mb-2" style={{ color: `hsl(var(--foreground))` }}>
                    No completed sessions
                  </h3>
                  <p style={{ color: `hsl(var(--muted-foreground))` }}>
                    Completed sessions will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </ThemedCardContent>
      </ThemedCard>
    </div>
  );
}