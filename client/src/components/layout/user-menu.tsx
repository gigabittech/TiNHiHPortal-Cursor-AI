import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ThemedDropdownMenu as DropdownMenu,
  ThemedDropdownMenuContent as DropdownMenuContent,
  ThemedDropdownMenuItem as DropdownMenuItem,
  ThemedDropdownMenuLabel as DropdownMenuLabel,
  ThemedDropdownMenuSeparator as DropdownMenuSeparator,
  ThemedDropdownMenuTrigger as DropdownMenuTrigger,
} from "@/components/ui/themed-dropdown";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronUp,
  Edit,
  Key,
  Bell,
  Palette,
  Shield
} from "lucide-react";
import { Link } from "wouter";
import { UserSettingsForm } from "@/components/settings/user-settings-form";

interface UserMenuProps {
  user: any;
  logout: () => void;
}

function getUserInitials(firstName?: string, lastName?: string) {
  if (!firstName && !lastName) return "U";
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
}

export function UserMenu({ user, logout }: UserMenuProps) {
  const [showUserSettings, setShowUserSettings] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  const handleSettingsOpen = () => {
    setDropdownOpen(false);
    setShowUserSettings(true);
  };

  const handleSettingsClose = () => {
    setShowUserSettings(false);
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full p-0 h-auto hover:bg-white/50 rounded-lg"
          >
            <div className="flex items-center space-x-3 w-full p-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-sm border border-primary/20">
                <span className="text-sm font-bold text-primary">
                  {user ? getUserInitials(user.firstName, user.lastName) : "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {user ? `${user.firstName} ${user.lastName}` : "User"}
                </p>
                <p className="text-xs text-slate-500 capitalize bg-slate-200 px-2 py-0.5 rounded-full inline-block">
                  {user?.role || "Role"}
                </p>
              </div>
              <ChevronUp className="w-4 h-4 text-slate-400" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-64 ml-4 mb-2" 
          side="top" 
          align="start"
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user ? `${user.firstName} ${user.lastName}` : "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
              <Badge variant="outline" className="text-xs w-fit mt-1">
                {user?.role || "Role"}
              </Badge>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSettingsOpen}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleSettingsOpen}>
            <Key className="mr-2 h-4 w-4" />
            <span>Change Password</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleSettingsOpen}>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleSettingsOpen}>
            <Palette className="mr-2 h-4 w-4" />
            <span>Appearance</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <Link href="/settings">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>System Settings</span>
            </DropdownMenuItem>
          </Link>
          
          {user?.role === 'admin' && (
            <DropdownMenuItem>
              <Shield className="mr-2 h-4 w-4" />
              <span>Admin Panel</span>
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Settings Dialog */}
      <Dialog open={showUserSettings} onOpenChange={handleSettingsClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              User Settings
            </DialogTitle>
            <DialogDescription>
              Manage your personal account settings and preferences.
            </DialogDescription>
          </DialogHeader>
          
          <UserSettingsForm 
            user={user} 
            onClose={handleSettingsClose}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}