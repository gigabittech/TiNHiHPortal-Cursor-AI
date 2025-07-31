import * as React from "react";
import { cn } from "@/lib/utils";

export interface ThemedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const ThemedInput = React.forwardRef<HTMLInputElement, ThemedInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300",
          className
        )}
        style={{
          backgroundColor: `hsl(var(--input))`,
          borderColor: `hsl(var(--border))`,
          color: `hsl(var(--foreground))`
        }}
        onFocus={(e) => {
          e.target.style.borderColor = `hsl(var(--ring))`;
          e.target.style.boxShadow = `0 0 0 2px hsl(var(--ring) / 0.2)`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = `hsl(var(--border))`;
          e.target.style.boxShadow = 'none';
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
ThemedInput.displayName = "ThemedInput";

export { ThemedInput };