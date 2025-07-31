import { useState } from "react";
import { Search, Bell, Plus, Menu, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import { ThemedButton } from "@/components/ui/themed-button";
import { ThemedInput } from "@/components/ui/themed-input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "./sidebar";
import { NotificationCenter } from "@/components/notifications/notification-center";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onQuickAction?: () => void;
  quickActionLabel?: string;
}

export function Header({ 
  title, 
  subtitle, 
  onQuickAction, 
  quickActionLabel = "New Appointment" 
}: HeaderProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    // TODO: Implement search functionality
  };

  return (
    <header 
      className="border-b px-4 lg:px-6 py-4 transition-colors duration-300"
      style={{
        backgroundColor: `hsl(var(--background))`,
        borderColor: `hsl(var(--border))`
      }}
    >
      <div className="flex items-center justify-between">
        {/* Mobile menu and title */}
        <div className="flex items-center space-x-4">
          {/* Mobile hamburger menu */}
          <Sheet>
            <SheetTrigger asChild>
              <ThemedButton variant="ghost" size="sm" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </ThemedButton>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <Sidebar isMobile={true} />
            </SheetContent>
          </Sheet>

          <div>
            <h1 
              className="text-xl lg:text-2xl font-bold transition-colors duration-300"
              style={{ color: `hsl(var(--foreground))` }}
            >
              {title}
            </h1>
            {subtitle && (
              <p 
                className="text-sm lg:text-base transition-colors duration-300"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                {subtitle.includes("{name}") 
                  ? subtitle.replace("{name}", user?.firstName || "")
                  : subtitle
                }
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Search - Hidden on mobile */}
          <div className="relative hidden md:block">
            <Search 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300" 
              style={{ color: `hsl(var(--muted-foreground))` }}
            />
            <ThemedInput
              type="text"
              placeholder="Search patients, appointments..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-48 lg:w-64 pl-10"
            />
          </div>
          
          {/* Notifications */}
          <NotificationCenter />

          {/* Quick Action */}
          {onQuickAction && (
            <ThemedButton onClick={onQuickAction} size="sm">
              <Plus className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">{quickActionLabel}</span>
            </ThemedButton>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
