import { cn } from "@/lib/utils";
import { ListingStatus } from "@/types/listing";

interface StatusBadgeProps {
  status: ListingStatus;
  className?: string;
}

const statusStyles: Record<ListingStatus, { bg: string; text: string; glow: string }> = {
  Active: {
    bg: "bg-[hsl(150,100%,50%)]/20",
    text: "text-[hsl(150,100%,50%)]",
    glow: "shadow-[0_0_12px_hsl(150,100%,50%,0.5)]",
  },
  Pending: {
    bg: "bg-[hsl(40,100%,50%)]/20",
    text: "text-[hsl(40,100%,50%)]",
    glow: "shadow-[0_0_12px_hsl(40,100%,50%,0.5)]",
  },
  Completed: {
    bg: "bg-[hsl(200,100%,60%)]/20",
    text: "text-[hsl(200,100%,60%)]",
    glow: "shadow-[0_0_12px_hsl(200,100%,60%,0.5)]",
  },
  Cancelled: {
    bg: "bg-destructive/20",
    text: "text-destructive",
    glow: "shadow-[0_0_12px_hsl(0,72%,51%,0.5)]",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles = statusStyles[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full",
        styles.bg,
        styles.text,
        styles.glow,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {status}
    </span>
  );
}
