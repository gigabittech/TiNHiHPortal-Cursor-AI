import { useState, useEffect, useRef } from "react";
import { ThemedCard, ThemedCardContent, ThemedCardHeader, ThemedCardTitle } from "@/components/ui/themed-card";
import { ThemedButton } from "@/components/ui/themed-button";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  Users, 
  Settings,
  Camera,
  Volume2,
  VolumeX,
  Maximize,
  MessageSquare,
  FileText,
  Clock,
  User
} from "lucide-react";
import type { TelehealthSessionWithDetails } from "@shared/schema";

interface VideoRoomProps {
  session: TelehealthSessionWithDetails;
  onEndCall: () => void;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleSpeaker: () => void;
  isMuted: boolean;
  isVideoOn: boolean;
  isSpeakerOn: boolean;
}

export function VideoRoom({
  session,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  isMuted,
  isVideoOn,
  isSpeakerOn
}: VideoRoomProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
  const [callDuration, setCallDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getConnectionColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div 
      className={`min-h-screen transition-colors duration-300 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ backgroundColor: `hsl(var(--background))` }}
    >
      {/* Header Bar */}
      <div 
        className="flex items-center justify-between p-4 border-b transition-colors duration-300"
        style={{
          backgroundColor: `hsl(var(--card))`,
          borderColor: `hsl(var(--border))`
        }}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Video 
              className="w-5 h-5 transition-colors duration-300"
              style={{ color: `hsl(var(--primary))` }}
            />
            <span 
              className="font-semibold transition-colors duration-300"
              style={{ color: `hsl(var(--foreground))` }}
            >
              Telehealth Session
            </span>
          </div>
          <Badge variant="secondary">
            {session.platform?.toUpperCase() || 'VIDEO'}
          </Badge>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
          </div>
          <div className={`flex items-center space-x-1 ${getConnectionColor()}`}>
            <div className="w-2 h-2 rounded-full bg-current"></div>
            <span className="text-xs capitalize">{connectionQuality}</span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Video Area */}
        <div className="flex-1 relative">
          {/* Patient Video (Main) */}
          <div className="h-full relative">
            <video
              ref={videoRef}
              className="w-full h-full object-cover bg-gray-900"
              autoPlay
              muted
            />
            
            {/* Patient Info Overlay */}
            <div className="absolute top-4 left-4">
              <div 
                className="px-3 py-2 rounded-lg backdrop-blur-sm transition-colors duration-300"
                style={{ backgroundColor: `hsl(var(--card) / 0.8)` }}
              >
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {session.patient?.user?.firstName} {session.patient?.user?.lastName}
                  </span>
                </div>
              </div>
            </div>

            {/* Provider Video (Picture-in-Picture) */}
            <div className="absolute bottom-4 right-4 w-64 h-48 rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <video
                className="w-full h-full object-cover bg-gray-800"
                autoPlay
                muted
              />
              <div className="absolute bottom-2 left-2">
                <span className="text-white text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                  Dr. {session.practitioner?.user?.firstName} {session.practitioner?.user?.lastName}
                </span>
              </div>
              {!isVideoOn && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <VideoOff className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Control Bar */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <div 
              className="flex items-center space-x-3 px-6 py-4 rounded-full backdrop-blur-sm shadow-lg transition-colors duration-300"
              style={{ backgroundColor: `hsl(var(--card) / 0.9)` }}
            >
              <ThemedButton
                variant={isMuted ? "destructive" : "secondary"}
                size="icon"
                onClick={onToggleMute}
                className="rounded-full"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </ThemedButton>

              <ThemedButton
                variant={isVideoOn ? "secondary" : "destructive"}
                size="icon"
                onClick={onToggleVideo}
                className="rounded-full"
              >
                {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </ThemedButton>

              <ThemedButton
                variant={isSpeakerOn ? "secondary" : "outline"}
                size="icon"
                onClick={onToggleSpeaker}
                className="rounded-full"
              >
                {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </ThemedButton>

              <ThemedButton
                variant="outline"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="rounded-full"
              >
                <Maximize className="w-5 h-5" />
              </ThemedButton>

              <ThemedButton
                variant="outline"
                size="icon"
                onClick={() => setShowChat(!showChat)}
                className="rounded-full"
              >
                <MessageSquare className="w-5 h-5" />
              </ThemedButton>

              <ThemedButton
                variant="outline"
                size="icon"
                onClick={() => setShowNotes(!showNotes)}
                className="rounded-full"
              >
                <FileText className="w-5 h-5" />
              </ThemedButton>

              <ThemedButton
                variant="destructive"
                size="icon"
                onClick={onEndCall}
                className="rounded-full ml-4"
              >
                <PhoneOff className="w-5 h-5" />
              </ThemedButton>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        {(showChat || showNotes) && (
          <div className="w-80 border-l transition-colors duration-300" style={{ borderColor: `hsl(var(--border))` }}>
            {showChat && (
              <ThemedCard className="h-full rounded-none border-0">
                <ThemedCardHeader className="pb-3">
                  <ThemedCardTitle className="text-lg">Session Chat</ThemedCardTitle>
                </ThemedCardHeader>
                <ThemedCardContent className="flex-1">
                  <div className="space-y-4 h-96 overflow-y-auto">
                    {/* Chat messages would go here */}
                    <div className="text-center text-sm" style={{ color: `hsl(var(--muted-foreground))` }}>
                      Chat is ready for communication
                    </div>
                  </div>
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="w-full px-3 py-2 border rounded-lg transition-colors duration-300"
                      style={{
                        backgroundColor: `hsl(var(--background))`,
                        borderColor: `hsl(var(--border))`,
                        color: `hsl(var(--foreground))`
                      }}
                    />
                  </div>
                </ThemedCardContent>
              </ThemedCard>
            )}

            {showNotes && (
              <ThemedCard className="h-full rounded-none border-0">
                <ThemedCardHeader className="pb-3">
                  <ThemedCardTitle className="text-lg">Session Notes</ThemedCardTitle>
                </ThemedCardHeader>
                <ThemedCardContent>
                  <textarea
                    placeholder="Add consultation notes..."
                    className="w-full h-96 p-3 border rounded-lg resize-none transition-colors duration-300"
                    style={{
                      backgroundColor: `hsl(var(--background))`,
                      borderColor: `hsl(var(--border))`,
                      color: `hsl(var(--foreground))`
                    }}
                  />
                </ThemedCardContent>
              </ThemedCard>
            )}
          </div>
        )}
      </div>
    </div>
  );
}