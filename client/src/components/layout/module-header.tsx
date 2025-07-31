import { ReactNode } from "react";
import { ThemedButton } from "@/components/ui/themed-button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface ModuleHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  showBackButton?: boolean;
  backPath?: string;
}

export function ModuleHeader({
  title,
  description,
  actions,
  showBackButton = false,
  backPath = "/dashboard"
}: ModuleHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <div 
      className="border-b p-6 transition-colors duration-300"
      style={{
        backgroundColor: `hsl(var(--background))`,
        borderColor: `hsl(var(--border))`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <ThemedButton
              variant="ghost"
              size="sm"
              onClick={() => setLocation(backPath)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </ThemedButton>
          )}
          <div>
            <h1 
              className="text-2xl font-bold transition-colors duration-300"
              style={{ color: `hsl(var(--foreground))` }}
            >
              {title}
            </h1>
            {description && (
              <p 
                className="text-sm mt-1 transition-colors duration-300"
                style={{ color: `hsl(var(--muted-foreground))` }}
              >
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}