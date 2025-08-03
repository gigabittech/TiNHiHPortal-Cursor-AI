import { Button } from "@/components/ui/button";
import { 
  ThemedDropdownMenu as DropdownMenu, 
  ThemedDropdownMenuContent as DropdownMenuContent, 
  ThemedDropdownMenuItem as DropdownMenuItem, 
  ThemedDropdownMenuTrigger as DropdownMenuTrigger 
} from "@/components/ui/themed-dropdown";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { CalendarSettings } from "@/components/calendar/calendar-settings";
import { BookingLink } from "@/components/calendar/booking-link";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Plus,
  Clock,
  CheckSquare,
  Bell,
  Users,
  Coffee,
  Settings
} from "lucide-react";
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns";
import type { CalendarView, EventType } from "@/pages/calendar";

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onViewChange: (view: CalendarView) => void;
  onNewEvent: (type: EventType, date?: Date, time?: string) => void;
}

export function CalendarHeader({ 
  currentDate, 
  view, 
  onDateChange, 
  onViewChange, 
  onNewEvent 
}: CalendarHeaderProps) {
  const navigateDate = (direction: "prev" | "next") => {
    let newDate: Date;
    
    switch (view) {
      case "month":
        newDate = direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1);
        break;
      case "week":
        newDate = direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1);
        break;
      case "day":
        newDate = direction === "prev" ? subDays(currentDate, 1) : addDays(currentDate, 1);
        break;
      default:
        newDate = currentDate;
    }
    
    onDateChange(newDate);
  };

  const getDateRangeText = () => {
    switch (view) {
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "week":
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${format(startOfWeek, "dd")} - ${format(endOfWeek, "dd MMM yyyy")}`;
      case "day":
        return format(currentDate, "EEEE, dd MMMM yyyy");
      default:
        return "";
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  return (
    <div className="border-b bg-background px-2 sm:px-6 py-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {/* Left side - Navigation and date */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="outline" size="sm" onClick={goToToday} className="cursor-pointer">
            Today
          </Button>
          
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigateDate("prev")}
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigateDate("next")}
              className="cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <h1 className="text-lg sm:text-xl font-semibold text-foreground hidden sm:block">
            {getDateRangeText()}
          </h1>
          <h1 className="text-sm font-semibold text-foreground block sm:hidden">
            {format(currentDate, view === "month" ? "MMM yyyy" : "MMM d")}
          </h1>
        </div>

        {/* Center - View toggle (Force day view on mobile) */}
        <div className="hidden md:flex items-center space-x-1 bg-muted rounded-lg p-1">
          {(["month", "week", "day"] as CalendarView[]).map((viewType) => (
            <Button
              key={viewType}
              variant={view === viewType ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                // On mobile, only allow day view
                if (window.innerWidth < 768 && viewType !== "day") {
                  return;
                }
                onViewChange(viewType);
              }}
              className={`capitalize cursor-pointer ${view === viewType ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
            >
              {viewType}
            </Button>
          ))}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Day view: icons only */}
          {view === "day" ? (
            <>
              <BookingLink />

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[500px] sm:w-[600px] overflow-y-auto">
                  <CalendarSettings onClose={() => {}} />
                </SheetContent>
              </Sheet>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="cursor-pointer">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onNewEvent("appointment")} className="cursor-pointer">
                    <Clock className="h-4 w-4 mr-2" />
                    Appointment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNewEvent("task")} className="cursor-pointer">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNewEvent("reminder")} className="cursor-pointer">
                    <Bell className="h-4 w-4 mr-2" />
                    Reminder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNewEvent("meeting")} className="cursor-pointer">
                    <Users className="h-4 w-4 mr-2" />
                    Meeting
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNewEvent("out-of-office")} className="cursor-pointer">
                    <Coffee className="h-4 w-4 mr-2" />
                    Out of office
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            /* Other views: show text labels */
            <>
              <BookingLink />

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[500px] sm:w-[600px] overflow-y-auto">
                  <CalendarSettings onClose={() => {}} />
                </SheetContent>
              </Sheet>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="cursor-pointer">
                    <Plus className="h-4 w-4 mr-2" />
                    New
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onNewEvent("appointment")} className="cursor-pointer">
                    <Clock className="h-4 w-4 mr-2" />
                    Appointment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNewEvent("task")} className="cursor-pointer">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNewEvent("reminder")} className="cursor-pointer">
                    <Bell className="h-4 w-4 mr-2" />
                    Reminder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNewEvent("meeting")} className="cursor-pointer">
                    <Users className="h-4 w-4 mr-2" />
                    Meeting
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNewEvent("out-of-office")} className="cursor-pointer">
                    <Coffee className="h-4 w-4 mr-2" />
                    Out of office
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </div>
  );
}