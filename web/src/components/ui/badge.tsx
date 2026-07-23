import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "accent" | "success" | "danger" | "mute";
}) {
  const tones = {
    default: "bg-white/[0.06] text-ink-soft border-line",
    accent: "bg-accent-soft text-accent-hi border-accent/25",
    success: "bg-success/10 text-success border-success/20",
    danger: "bg-danger/10 text-danger border-danger/20",
    mute: "bg-transparent text-ink-mute border-line",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
