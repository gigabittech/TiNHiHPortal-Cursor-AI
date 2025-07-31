import { ThemedCard, ThemedCardContent, ThemedCardHeader, ThemedCardTitle } from "@/components/ui/themed-card";
import { CheckCircle, FileText, UserPlus, DollarSign } from "lucide-react";

interface RecentActivityProps {
  className?: string;
}

export function RecentActivity({ className }: RecentActivityProps) {
  // Mock recent activities - in a real app, this would come from an API
  const activities = [
    {
      id: 1,
      type: "appointment_completed",
      message: "Completed appointment with Sarah Wilson",
      timestamp: "2 hours ago",
      icon: CheckCircle,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      id: 2,
      type: "notes_updated",
      message: "Updated SOAP notes for Michael Chen", 
      timestamp: "3 hours ago",
      icon: FileText,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      id: 3,
      type: "patient_registered",
      message: "New patient registered: Emma Davis",
      timestamp: "4 hours ago",
      icon: UserPlus,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      id: 4,
      type: "payment_received",
      message: "Payment received from David Rodriguez",
      timestamp: "6 hours ago",
      icon: DollarSign,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
  ];

  return (
    <ThemedCard className={`rounded-xl ${className}`}>
      <ThemedCardHeader>
        <ThemedCardTitle>Recent Activity</ThemedCardTitle>
      </ThemedCardHeader>
      <ThemedCardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mt-0.5 transition-colors duration-300"
                style={{ backgroundColor: `hsl(var(--primary) / 0.1)` }}
              >
                <activity.icon 
                  className="w-4 h-4 transition-colors duration-300"
                  style={{ color: `hsl(var(--primary))` }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p 
                  className="text-sm transition-colors duration-300"
                  style={{ color: `hsl(var(--foreground))` }}
                >
                  {activity.message}
                </p>
                <p 
                  className="text-xs transition-colors duration-300"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                >
                  {activity.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
