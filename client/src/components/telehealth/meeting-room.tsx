import { useState, useEffect } from "react";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  MessageSquare, 
  Users, 
  Settings, 
  Maximize, 
  Minimize,
  Clock,
  Volume2,
  VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { TelehealthSessionWithDetails } from "@shared/schema";

interface TelehealthMeetingRoomProps {
  session: TelehealthSessionWithDetails;
  onEndSession: () => void;
  onLeaveSession: () => void;
}

export function TelehealthMeetingRoom({
  session,
  onEndSession,
  onLeaveSession,
}: TelehealthMeetingRoomProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [sessionDuration, setSessionDuration] = useState(0);
  const [volume, setVolume] = useState([50]);
  const [participantCount] = useState(2); // Simulated

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (session.sessionStartedAt) {
        const duration = Math.floor(
          (Date.now() - new Date(session.sessionStartedAt).getTime()) / 1000
        );
        setSessionDuration(duration);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.sessionStartedAt]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    // In a real app, this would initiate screen sharing
  };

  const sendChatMessage = () => {
    if (chatMessage.trim()) {
      // In a real app, this would send the message
      console.log("Sending message:", chatMessage);
      setChatMessage("");
    }
  };

  const getPlatformContent = () => {
    switch (session.platform) {
      case "zoom":
        return (
          <div className="w-full h-64 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">Zoom Meeting Active</h3>
              <p className="text-blue-100">
                Meeting ID: {session.meetingId}
              </p>
              {session.meetingUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.open(session.meetingUrl!, '_blank')}
                >
                  Open in Zoom App
                </Button>
              )}
            </div>
          </div>
        );
      
      case "teams":
        return (
          <div className="w-full h-64 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">Microsoft Teams Meeting</h3>
              <p className="text-purple-100">
                Meeting ID: {session.meetingId}
              </p>
              {session.meetingUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.open(session.meetingUrl!, '_blank')}
                >
                  Open in Teams App
                </Button>
              )}
            </div>
          </div>
        );
      
      case "google_meet":
        return (
          <div className="w-full h-64 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <Monitor className="w-16 h-16 mx-auto mb-4 opacity-80" />
              <h3 className="text-xl font-semibold mb-2">Google Meet Active</h3>
              <p className="text-green-100">
                Meeting ID: {session.meetingId}
              </p>
              {session.meetingUrl && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => window.open(session.meetingUrl!, '_blank')}
                >
                  Open in Google Meet
                </Button>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">
            Telehealth Session - {session.patient.user.firstName} {session.patient.user.lastName}
          </h1>
          <Badge variant="secondary" className="bg-green-600 text-white">
            {session.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{formatDuration(sessionDuration)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">{participantCount}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Main Video Area */}
        <div className="flex-1 p-4">
          <div className="h-full flex flex-col">
            {/* Video Container */}
            <div className="flex-1 mb-4">
              {getPlatformContent()}
            </div>

            {/* Controls */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-4">
                {/* Microphone */}
                <Button
                  variant={isMuted ? "destructive" : "secondary"}
                  size="lg"
                  onClick={() => setIsMuted(!isMuted)}
                  className="rounded-full w-12 h-12"
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                {/* Video */}
                <Button
                  variant={isVideoOff ? "destructive" : "secondary"}
                  size="lg"
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className="rounded-full w-12 h-12"
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </Button>

                {/* Screen Share */}
                <Button
                  variant={isScreenSharing ? "default" : "secondary"}
                  size="lg"
                  onClick={handleScreenShare}
                  className="rounded-full w-12 h-12"
                >
                  <Monitor className="w-5 h-5" />
                </Button>

                {/* Chat */}
                <Button
                  variant={showChat ? "default" : "secondary"}
                  size="lg"
                  onClick={() => setShowChat(!showChat)}
                  className="rounded-full w-12 h-12"
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>

                {/* Volume */}
                <div className="flex items-center space-x-2 px-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setVolume(volume[0] > 0 ? [0] : [50])}
                  >
                    {volume[0] === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </Button>
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={100}
                    step={1}
                    className="w-20"
                  />
                </div>

                {/* Leave/End */}
                <div className="flex space-x-2 ml-8">
                  <Button
                    variant="outline"
                    onClick={onLeaveSession}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Leave
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={onEndSession}
                  >
                    <PhoneOff className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold">Chat</h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-sm font-medium">Dr. {session.practitioner.user.firstName}</p>
                  <p className="text-sm text-gray-300 mt-1">
                    Welcome to our telehealth session. How are you feeling today?
                  </p>
                  <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                </div>
                
                <div className="bg-blue-600 p-3 rounded-lg ml-8">
                  <p className="text-sm font-medium">{session.patient.user.firstName}</p>
                  <p className="text-sm text-gray-100 mt-1">
                    I'm doing well, thank you. Ready to discuss my symptoms.
                  </p>
                  <p className="text-xs text-blue-200 mt-1">1 minute ago</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <Textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 min-h-[60px] bg-gray-700 border-gray-600"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={!chatMessage.trim()}
                  className="self-end"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Session Info Panel */}
      <div className="absolute top-20 right-4 w-72">
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Session Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Patient:</span>
              <span>{session.patient.user.firstName} {session.patient.user.lastName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Provider:</span>
              <span>Dr. {session.practitioner.user.firstName} {session.practitioner.user.lastName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Platform:</span>
              <span className="capitalize">{session.platform.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Started:</span>
              <span>
                {session.sessionStartedAt 
                  ? new Date(session.sessionStartedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Not started'
                }
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Duration:</span>
              <span>{formatDuration(sessionDuration)}</span>
            </div>
            {session.passcode && (
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Passcode:</span>
                  <span className="font-mono">{session.passcode}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}