import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ModuleHeader } from "@/components/layout/module-header";
import { ThemedButton } from "@/components/ui/themed-button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TelehealthSessionWithDetails, InsertTelehealthSession } from "@shared/schema";
import { CreateTelehealthSessionForm } from "@/components/telehealth/create-session-form";
import { VideoRoom } from "@/components/telehealth/video-room";
import { SessionDashboard } from "@/components/telehealth/session-dashboard";

export default function TelehealthPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TelehealthSessionWithDetails | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch telehealth sessions
  const { data: sessions = [], isLoading } = useQuery<TelehealthSessionWithDetails[]>({
    queryKey: ['/api/telehealth-sessions'],
  });

  // Fetch upcoming appointments (for scheduling telehealth)
  const { data: appointments = [] } = useQuery<any[]>({
    queryKey: ['/api/appointments'],
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (data: InsertTelehealthSession) => 
      apiRequest('/api/telehealth-sessions', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telehealth-sessions'] });
      setCreateDialogOpen(false);
      toast({
        title: "Session scheduled",
        description: "Telehealth session has been scheduled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule session",
        variant: "destructive",
      });
    },
  });

  // Join session mutation
  const joinSessionMutation = useMutation({
    mutationFn: ({ id, isPatient }: { id: string; isPatient: boolean }) =>
      apiRequest(`/api/telehealth-sessions/${id}/join`, 'POST', { isPatient }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telehealth-sessions'] });
      toast({
        title: "Joined session",
        description: "Successfully joined the telehealth session.",
      });
    },
  });

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/telehealth-sessions/${id}/start`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telehealth-sessions'] });
      toast({
        title: "Session started",
        description: "Telehealth session has been started.",
      });
    },
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/telehealth-sessions/${id}/end`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telehealth-sessions'] });
      toast({
        title: "Session ended",
        description: "Telehealth session has been ended.",
      });
    },
  });

  const handleCreateSession = (data: InsertTelehealthSession) => {
    createSessionMutation.mutate(data);
  };

  const handleJoinSession = (session: TelehealthSessionWithDetails, isPatient: boolean = false) => {
    joinSessionMutation.mutate({ id: session.id, isPatient });
    setSelectedSession(session);
    setIsInCall(true);
  };

  const handleStartSession = (id: string) => {
    startSessionMutation.mutate(id);
  };

  const handleEndSession = (id: string) => {
    endSessionMutation.mutate(id);
  };

  // Video Room for active sessions - but keep the main layout
  if (isInCall && selectedSession) {
    return (
      <div 
        className="min-h-screen transition-colors duration-300"
        style={{ backgroundColor: `hsl(var(--background))` }}
      >
        <VideoRoom
          session={selectedSession}
          onEndCall={() => {
            handleEndSession(selectedSession.id);
            setSelectedSession(null);
            setIsInCall(false);
          }}
          onToggleMute={() => setIsMuted(!isMuted)}
          onToggleVideo={() => setIsVideoOn(!isVideoOn)}
          onToggleSpeaker={() => setIsSpeakerOn(!isSpeakerOn)}
          isMuted={isMuted}
          isVideoOn={isVideoOn}
          isSpeakerOn={isSpeakerOn}
        />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: `hsl(var(--background))` }}
    >
      <ModuleHeader
        title="Telehealth"
        description="Manage virtual consultations and video sessions"
        actions={
          <Sheet open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <SheetTrigger asChild>
              <ThemedButton>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Session
              </ThemedButton>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Schedule Telehealth Session</SheetTitle>
                <SheetDescription>
                  Create a new virtual consultation session with multi-platform support
                </SheetDescription>
              </SheetHeader>
              <CreateTelehealthSessionForm
                appointments={appointments}
                onSubmit={handleCreateSession}
                onCancel={() => setCreateDialogOpen(false)}
                isLoading={createSessionMutation.isPending}
              />
            </SheetContent>
          </Sheet>
        }
      />
      
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <SessionDashboard
          sessions={sessions}
          onJoinSession={handleJoinSession}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
        />
      </div>
    </div>
  );
}