import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const themedButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
        outline: "",
        secondary: "",
        ghost: "",
        link: "underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ThemedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof themedButtonVariants> {
  asChild?: boolean;
}

const ThemedButton = React.forwardRef<HTMLButtonElement, ThemedButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    const getVariantStyles = () => {
      switch (variant) {
        case "default":
          return {
            backgroundColor: `hsl(var(--primary))`,
            color: `hsl(var(--primary-foreground))`,
          };
        case "destructive":
          return {
            backgroundColor: `hsl(var(--destructive))`,
            color: `hsl(var(--destructive-foreground))`,
          };
        case "outline":
          return {
            borderColor: `hsl(var(--border))`,
            backgroundColor: `hsl(var(--background))`,
            color: `hsl(var(--foreground))`,
            borderWidth: '1px',
            borderStyle: 'solid',
          };
        case "secondary":
          return {
            backgroundColor: `hsl(var(--secondary))`,
            color: `hsl(var(--secondary-foreground))`,
          };
        case "ghost":
          return {
            backgroundColor: 'transparent',
            color: `hsl(var(--foreground))`,
          };
        case "link":
          return {
            backgroundColor: 'transparent',
            color: `hsl(var(--primary))`,
          };
        default:
          return {
            backgroundColor: `hsl(var(--primary))`,
            color: `hsl(var(--primary-foreground))`,
          };
      }
    };

    return (
      <Comp
        className={cn(themedButtonVariants({ variant, size, className }))}
        style={{
          ...getVariantStyles(),
          ...style,
        }}
        onMouseEnter={(e) => {
          if (variant === "ghost") {
            e.currentTarget.style.backgroundColor = `hsl(var(--accent))`;
            e.currentTarget.style.color = `hsl(var(--accent-foreground))`;
          } else if (variant === "outline") {
            e.currentTarget.style.backgroundColor = `hsl(var(--accent))`;
          }
        }}
        onMouseLeave={(e) => {
          const styles = getVariantStyles();
          Object.assign(e.currentTarget.style, styles);
        }}
        ref={ref}
        {...props}
      />
    );
  }
);
ThemedButton.displayName = "ThemedButton";

export { ThemedButton, themedButtonVariants };