import { cn } from "@/lib/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function Badge({ children, className, color }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium", className)}
      style={color ? { backgroundColor: `${color}18`, color } : undefined}
    >
      {children}
    </span>
  );
}
