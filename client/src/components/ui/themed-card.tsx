import * as React from "react";
import { cn } from "@/lib/utils";

const ThemedCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("transition-colors duration-300", className)}
    style={{
      backgroundColor: `hsl(var(--card))`,
      color: `hsl(var(--card-foreground))`,
      borderColor: `hsl(var(--border))`,
      borderWidth: '1px',
      borderStyle: 'solid'
    }}
    {...props}
  />
));
ThemedCard.displayName = "ThemedCard";

const ThemedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 transition-colors duration-300", className)}
    style={{
      borderBottomColor: `hsl(var(--border))`,
      borderBottomWidth: '1px',
      borderBottomStyle: 'solid'
    }}
    {...props}
  />
));
ThemedCardHeader.displayName = "ThemedCardHeader";

const ThemedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight transition-colors duration-300", className)}
    style={{ color: `hsl(var(--card-foreground))` }}
    {...props}
  />
));
ThemedCardTitle.displayName = "ThemedCardTitle";

const ThemedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm transition-colors duration-300", className)}
    style={{ color: `hsl(var(--muted-foreground))` }}
    {...props}
  />
));
ThemedCardDescription.displayName = "ThemedCardDescription";

const ThemedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn("p-6 pt-0 transition-colors duration-300", className)} 
    {...props} 
  />
));
ThemedCardContent.displayName = "ThemedCardContent";

const ThemedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 transition-colors duration-300", className)}
    {...props}
  />
));
ThemedCardFooter.displayName = "ThemedCardFooter";

export { ThemedCard, ThemedCardHeader, ThemedCardFooter, ThemedCardTitle, ThemedCardDescription, ThemedCardContent };