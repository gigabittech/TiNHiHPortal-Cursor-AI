import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const ThemedDropdownMenu = DropdownMenuPrimitive.Root;

const ThemedDropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const ThemedDropdownMenuGroup = DropdownMenuPrimitive.Group;

const ThemedDropdownMenuPortal = DropdownMenuPrimitive.Portal;

const ThemedDropdownMenuSub = DropdownMenuPrimitive.Sub;

const ThemedDropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const ThemedDropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors duration-300 focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    style={{
      backgroundColor: `hsl(var(--card))`,
      color: `hsl(var(--card-foreground))`,
    }}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
ThemedDropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const ThemedDropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-lg transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className
    )}
    style={{
      backgroundColor: `hsl(var(--card))`,
      borderColor: `hsl(var(--border))`,
      color: `hsl(var(--card-foreground))`,
      backdropFilter: 'blur(8px)',
    }}
    {...props}
  />
));
ThemedDropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const ThemedDropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      style={{
        backgroundColor: `hsl(var(--card))`,
        borderColor: `hsl(var(--border))`,
        color: `hsl(var(--card-foreground))`,
        boxShadow: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`,
        backdropFilter: 'blur(8px)',
      }}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
ThemedDropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const ThemedDropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors duration-300 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    style={{
      color: `hsl(var(--card-foreground))`,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = `hsl(var(--accent))`;
      e.currentTarget.style.color = `hsl(var(--accent-foreground))`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = `hsl(var(--card-foreground))`;
    }}
    {...props}
  />
));
ThemedDropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const ThemedDropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors duration-300 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    style={{
      color: `hsl(var(--card-foreground))`,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = `hsl(var(--accent))`;
      e.currentTarget.style.color = `hsl(var(--accent-foreground))`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = `hsl(var(--card-foreground))`;
    }}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
ThemedDropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const ThemedDropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors duration-300 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    style={{
      color: `hsl(var(--card-foreground))`,
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = `hsl(var(--accent))`;
      e.currentTarget.style.color = `hsl(var(--accent-foreground))`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = `hsl(var(--card-foreground))`;
    }}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
ThemedDropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const ThemedDropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold transition-colors duration-300",
      inset && "pl-8",
      className
    )}
    style={{
      color: `hsl(var(--foreground))`,
    }}
    {...props}
  />
));
ThemedDropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const ThemedDropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px transition-colors duration-300", className)}
    style={{
      backgroundColor: `hsl(var(--border))`,
    }}
    {...props}
  />
));
ThemedDropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const ThemedDropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60 transition-colors duration-300", className)}
      style={{
        color: `hsl(var(--muted-foreground))`,
      }}
      {...props}
    />
  );
};
ThemedDropdownMenuShortcut.displayName = "ThemedDropdownMenuShortcut";

export {
  ThemedDropdownMenu,
  ThemedDropdownMenuTrigger,
  ThemedDropdownMenuContent,
  ThemedDropdownMenuItem,
  ThemedDropdownMenuCheckboxItem,
  ThemedDropdownMenuRadioItem,
  ThemedDropdownMenuLabel,
  ThemedDropdownMenuSeparator,
  ThemedDropdownMenuShortcut,
  ThemedDropdownMenuGroup,
  ThemedDropdownMenuPortal,
  ThemedDropdownMenuSub,
  ThemedDropdownMenuSubContent,
  ThemedDropdownMenuSubTrigger,
  ThemedDropdownMenuRadioGroup,
};