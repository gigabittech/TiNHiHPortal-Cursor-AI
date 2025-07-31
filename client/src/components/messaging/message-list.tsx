import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Reply } from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";

export function MessageList() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/messages", { limit, offset: page * limit }],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      });
      const response = await api.get(`/api/messages?${params}`);
      return response;
    },
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/messages/unread-count"],
    queryFn: async () => {
      const response = await api.get("/api/messages/unread-count");
      return response;
    },
  });

  const handleNewMessage = () => {
    // TODO: Implement new message modal
    console.log("New message");
  };

  const handleReply = (message: any) => {
    // TODO: Implement reply functionality
    console.log("Reply to message:", message);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-slate-300 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-300 rounded w-1/3"></div>
                    <div className="h-3 bg-slate-300 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle>Messages</CardTitle>
            {unreadCount?.count > 0 && (
              <Badge variant="destructive">{unreadCount.count} unread</Badge>
            )}
          </div>
          <Button onClick={handleNewMessage}>
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {messages && messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message: any) => (
              <div key={message.id} className={`flex items-start space-x-4 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors ${
                message.status === "unread" ? "bg-blue-50 border-blue-200" : ""
              }`}>
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-medium text-sm">
                    {message.sender?.firstName?.charAt(0)}{message.sender?.lastName?.charAt(0)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-slate-900">
                      {message.sender?.firstName} {message.sender?.lastName}
                    </h3>
                    {message.status === "unread" && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        Unread
                      </Badge>
                    )}
                  </div>
                  
                  <h4 className="text-sm font-medium text-slate-700 mb-1">{message.subject}</h4>
                  <p className="text-sm text-slate-600 line-clamp-2">{message.content}</p>
                  
                  <p className="text-xs text-slate-400 mt-2">
                    {format(new Date(message.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleReply(message)}
                    title="Reply"
                  >
                    <Reply className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <div className="flex justify-between items-center pt-4">
              <Button 
                variant="outline" 
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600">
                Page {page + 1}
              </span>
              <Button 
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={!messages || messages.length < limit}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No messages yet</h3>
            <p className="text-slate-600 mb-4">Start communicating with patients and colleagues</p>
            <Button onClick={handleNewMessage}>
              <Plus className="w-4 h-4 mr-2" />
              Send First Message
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
