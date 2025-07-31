import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ThemedDropdownMenu as DropdownMenu,
  ThemedDropdownMenuContent as DropdownMenuContent,
  ThemedDropdownMenuItem as DropdownMenuItem,
  ThemedDropdownMenuTrigger as DropdownMenuTrigger,
} from "@/components/ui/themed-dropdown";
import { useTheme } from "@/context/theme-context";

export function ThemeToggle() {
  const { theme, setTheme, currentTheme } = useTheme();

  const getIcon = () => {
    if (theme === 'auto') {
      return <Monitor className="h-4 w-4" />;
    }
    return currentTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 px-0 transition-colors duration-300"
          style={{
            color: `hsl(var(--foreground))`,
            backgroundColor: 'transparent'
          }}
        >
          {getIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("auto")}
          className="cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}