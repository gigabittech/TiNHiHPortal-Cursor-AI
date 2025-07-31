import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import tinhihLogo from "@assets/tinhih-logo.svg";
import { 
  BarChart3, 
  Users, 
  Calendar, 
  FileText, 
  Video, 
  CreditCard, 
  MessageSquare, 
  BarChart, 
  Stethoscope,
  Settings,
  CalendarCheck
} from "lucide-react";
import { UserMenu } from "@/components/layout/user-menu";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const getNavigationSections = (userRole: string) => {
  if (userRole === 'patient') {
    return [
      {
        title: "My Health",
        items: [
          { name: "Overview", path: "/", icon: BarChart3 },
          { name: "Appointments", path: "/patient-portal", icon: Calendar },
          { name: "Medical Records", path: "/patient-portal", icon: FileText },
          { name: "Messages", path: "/patient-portal", icon: MessageSquare },
          { name: "Billing", path: "/patient-portal", icon: CreditCard },
          { name: "Profile", path: "/patient-portal", icon: Users },
        ]
      }
    ];
  }
  
  // Default navigation for practitioners, staff, and admin
  return [
    {
      title: "Dashboard",
      items: [
        { name: "Overview", path: "/", icon: BarChart3 },
      ]
    },
    {
      title: "Patient Care",
      items: [
        { name: "Patients", path: "/patients", icon: Users },
        { name: "Clinical Notes", path: "/clinical-notes", icon: FileText },
        { name: "Telehealth", path: "/telehealth", icon: Video },
      ]
    },
    {
      title: "Scheduling",
      items: [
        { name: "Calendar", path: "/calendar", icon: Calendar },
        { name: "Appointments", path: "/appointments", icon: CalendarCheck },
      ]
    },
    {
      title: "Business Operations",
      items: [
        { name: "Billing", path: "/billing", icon: CreditCard },
        { name: "Messages", path: "/messages", icon: MessageSquare },
        { name: "Reports", path: "/reports", icon: BarChart },
        { name: "Settings", path: "/settings", icon: Settings },
      ]
    }
  ];
};

interface SidebarProps {
  isMobile?: boolean;
}

export function Sidebar({ isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const navigationSections = getNavigationSections(user?.role || 'patient');

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <aside 
      className={`w-64 shadow-lg border-r flex flex-col transition-all duration-300 ease-in-out overflow-hidden ${!isMobile ? 'hidden lg:flex' : 'flex'}`}
      style={{
        backgroundColor: `hsl(var(--sidebar-background))`,
        borderColor: `hsl(var(--sidebar-border))`,
        color: `hsl(var(--sidebar-foreground))`
      }}
    >
      {/* Logo Header */}
      <div 
        className="p-6 border-b transition-colors duration-300" 
        style={{
          borderColor: `hsl(var(--sidebar-border))`,
          backgroundColor: `hsl(var(--sidebar-background))`
        }}
      >
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-xl overflow-hidden shadow-sm p-1 transition-colors duration-300"
            style={{ backgroundColor: `hsl(var(--card))` }}
          >
            <img 
              src={tinhihLogo} 
              alt="TiNHiH Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span 
              className="text-xl font-bold transition-colors duration-300"
              style={{ color: `hsl(var(--sidebar-foreground))` }}
            >
              TiNHiH Foundation
            </span>
            <p 
              className="text-xs mt-0.5 transition-colors duration-300"
              style={{ color: `hsl(var(--muted-foreground))` }}
            >
              Management Portal
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <NotificationCenter />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {navigationSections.map((section) => (
            <div key={section.title}>
              <h3 
                className="text-xs font-semibold uppercase tracking-wider mb-3 px-3 transition-colors duration-300"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location === item.path;
                  const Icon = item.icon;
                  
                  return (
                    <li key={item.path}>
                      <Link href={item.path}>
                        <div
                          className="flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 cursor-pointer group"
                          style={isActive ? {
                            backgroundColor: `hsl(var(--sidebar-accent) / 0.1)`,
                            color: `hsl(var(--sidebar-accent))`,
                            borderColor: `hsl(var(--sidebar-accent) / 0.2)`,
                            borderWidth: '1px',
                            borderStyle: 'solid'
                          } : {
                            color: `hsl(var(--sidebar-foreground) / 0.7)`
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = `hsl(var(--sidebar-muted))`;
                              e.currentTarget.style.color = `hsl(var(--sidebar-foreground))`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = `hsl(var(--sidebar-foreground) / 0.7)`;
                            }
                          }}
                        >
                          <Icon 
                            className="w-5 h-5 transition-colors duration-200"
                            style={{
                              color: isActive 
                                ? `hsl(var(--sidebar-accent))` 
                                : `hsl(var(--muted-foreground))`
                            }}
                          />
                          <span>{item.name}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div 
        className="p-4 border-t transition-colors duration-300"
        style={{
          borderColor: `hsl(var(--sidebar-border))`,
          backgroundColor: `hsl(var(--sidebar-muted) / 0.3)`
        }}
      >
        <UserMenu user={user} logout={logout} />
      </div>
    </aside>
  );
}
