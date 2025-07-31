import { ThemedCard, ThemedCardContent, ThemedCardHeader, ThemedCardTitle } from "@/components/ui/themed-card";
import { ThemedButton } from "@/components/ui/themed-button";
import { UserPlus, CalendarPlus, FileText, Receipt } from "lucide-react";
import { useLocation } from "wouter";

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const [, setLocation] = useLocation();

  const actions = [
    {
      title: "New Patient",
      description: "Add patient record",
      icon: UserPlus,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      onClick: () => setLocation("/patients?action=new"),
    },
    {
      title: "Schedule",
      description: "Book appointment",
      icon: CalendarPlus,
      iconBg: "bg-secondary/10",
      iconColor: "text-secondary",
      onClick: () => setLocation("/appointments?action=new"),
    },
    {
      title: "Write Notes",
      description: "Clinical documentation",
      icon: FileText,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      onClick: () => setLocation("/clinical-notes?action=new"),
    },
    {
      title: "Create Invoice",
      description: "Generate billing",
      icon: Receipt,
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      onClick: () => setLocation("/billing?action=new"),
    },
  ];

  return (
    <ThemedCard className={`rounded-xl ${className}`}>
      <ThemedCardHeader>
        <ThemedCardTitle>Quick Actions</ThemedCardTitle>
      </ThemedCardHeader>
      <ThemedCardContent>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <ThemedButton
              key={index}
              variant="ghost"
              className="w-full justify-start p-3 h-auto"
              onClick={action.onClick}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-colors duration-300"
                style={{ backgroundColor: `hsl(var(--primary) / 0.1)` }}
              >
                <action.icon 
                  className="w-5 h-5 transition-colors duration-300"
                  style={{ color: `hsl(var(--primary))` }}
                />
              </div>
              <div className="text-left">
                <p 
                  className="font-medium transition-colors duration-300"
                  style={{ color: `hsl(var(--foreground))` }}
                >
                  {action.title}
                </p>
                <p 
                  className="text-sm transition-colors duration-300"
                  style={{ color: `hsl(var(--muted-foreground))` }}
                >
                  {action.description}
                </p>
              </div>
            </ThemedButton>
          ))}
        </div>
      </ThemedCardContent>
    </ThemedCard>
  );
}
