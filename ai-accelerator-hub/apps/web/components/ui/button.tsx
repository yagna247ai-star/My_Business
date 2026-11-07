import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-full text-sm font-semibold transition-colors focus-visible:outline-none disabled:opacity-50";
    const variants = {
      default: "bg-[#3878F6] text-white hover:bg-[#2f66d6] shadow",
      outline: "border border-[#2A3250] bg-[#1E2438] hover:border-[#3878F6]/30",
      ghost: "hover:bg-[#1E2438] text-[#A0A8C0] hover:text-white",
    };
    const sizes = {
      default: "h-10 px-6 py-2",
      sm: "h-8 px-4 text-xs",
      lg: "h-11 px-8",
      icon: "h-9 w-9",
    };
    return <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />;
  }
);
Button.displayName = "Button";
