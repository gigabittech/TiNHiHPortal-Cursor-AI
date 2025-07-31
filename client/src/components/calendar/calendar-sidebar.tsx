import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";

interface CalendarSidebarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  selectedTeamMembers: string[];
  onTeamMemberToggle: (memberId: string) => void;
}

interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isDemo?: boolean;
}

const DEMO_TEAM_MEMBERS: TeamMember[] = [
  { id: "all", name: "All team members", avatar: "", color: "bg-blue-500" },
  { id: "current", name: "Current User", avatar: "CU", color: "bg-primary" },
  { id: "demo", name: "Demo User", avatar: "DU", color: "bg-green-500", isDemo: true },
  { id: "unassigned", name: "Unassigned", avatar: "", color: "bg-gray-400" },
];

export function CalendarSidebar({ 
  currentDate, 
  onDateSelect, 
  selectedTeamMembers, 
  onTeamMemberToggle 
}: CalendarSidebarProps) {
  const [teamMembersOpen, setTeamMembersOpen] = useState(true);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [otherEventsOpen, setOtherEventsOpen] = useState(false);

  // Get practitioners for team members
  const { data: practitioners } = useQuery({
    queryKey: ["/api/practitioners"],
    queryFn: async () => {
      const response = await fetch("/api/practitioners", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch practitioners");
      return response.json();
    },
  });

  const teamMembers: TeamMember[] = [
    ...DEMO_TEAM_MEMBERS,
    ...(practitioners || []).map((p: any) => ({
      id: p.id,
      name: `${p.user?.firstName} ${p.user?.lastName}`,
      avatar: `${p.user?.firstName?.[0] || ''}${p.user?.lastName?.[0] || ''}`,
      color: "bg-blue-500",
    }))
  ];

  // Generate mini calendar
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const renderMiniCalendar = () => {
    const today = new Date();
    const monthName = format(currentDate, "MMMM yyyy");
    
    // Get first day of month and pad with previous month days
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDay = firstDayOfMonth.getDay();
    const daysInPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    
    const calendarDays = [];
    
    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      calendarDays.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }
    
    // Current month days
    days.forEach(day => {
      calendarDays.push({
        date: day,
        isCurrentMonth: true,
      });
    });
    
    // Next month days to fill the grid
    const remainingDays = 42 - calendarDays.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push({
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i),
        isCurrentMonth: false,
      });
    }

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{monthName}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-7 gap-1 text-xs">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={`day-header-${day}-${index}`} className="text-center font-medium text-muted-foreground p-1">
                {day}
              </div>
            ))}
            {calendarDays.map((dayInfo, index) => {
              const isToday = isSameDay(dayInfo.date, today);
              const isSelected = isSameDay(dayInfo.date, currentDate);
              
              return (
                <button
                  key={`calendar-day-${index}-${format(dayInfo.date, 'yyyy-MM-dd')}`}
                  onClick={() => onDateSelect(dayInfo.date)}
                  className={`
                    text-center p-1 rounded text-xs hover:bg-accent transition-colors cursor-pointer
                    ${!dayInfo.isCurrentMonth ? 'text-muted-foreground' : ''}
                    ${isToday ? 'bg-primary text-primary-foreground font-medium' : ''}
                    ${isSelected && !isToday ? 'bg-accent' : ''}
                  `}
                >
                  {format(dayInfo.date, 'd')}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-64 lg:w-80 bg-background border-r p-2 lg:p-4 space-y-4 overflow-y-auto">
      {/* Mini Calendar */}
      {renderMiniCalendar()}

      {/* Team Members */}
      <Card>
        <Collapsible open={teamMembersOpen} onOpenChange={setTeamMembersOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Team members</CardTitle>
                {teamMembersOpen ? (
                  <ChevronDown className="h-4 w-4 cursor-pointer" />
                ) : (
                  <ChevronRight className="h-4 w-4 cursor-pointer" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={member.id}
                    checked={selectedTeamMembers.includes(member.id)}
                    onCheckedChange={() => onTeamMemberToggle(member.id)}
                    className="cursor-pointer"
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    {member.avatar && (
                      <div className={`w-6 h-6 rounded-full ${member.color} flex items-center justify-center text-white text-xs font-medium`}>
                        {member.avatar}
                      </div>
                    )}
                    <label 
                      htmlFor={member.id}
                      className={`text-sm cursor-pointer ${member.isDemo ? 'text-muted-foreground' : ''}`}
                    >
                      {member.name}
                      {member.isDemo && <span className="ml-1 text-xs">(Demo)</span>}
                    </label>
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Services */}
      <Card>
        <Collapsible open={servicesOpen} onOpenChange={setServicesOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Services</CardTitle>
                {servicesOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">No services configured</p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Other Events */}
      <Card>
        <Collapsible open={otherEventsOpen} onOpenChange={setOtherEventsOpen}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Other events</CardTitle>
                {otherEventsOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">No other events</p>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}