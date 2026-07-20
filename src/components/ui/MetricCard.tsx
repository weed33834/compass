import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number | null;
  accent?: "brass" | "tide" | "coral" | "starlight";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light";
  suffix?: string;
  className?: string;
}

const accentStyles: Record<string, string> = {
  brass: "border-l-brass text-brass",
  tide: "border-l-tide text-tide",
  coral: "border-l-coral text-coral",
  starlight: "border-l-starlight text-starlight",
};

const sizeStyles: Record<string, string> = {
  sm: "px-2 py-1 text-sm",
  md: "px-3 py-2 text-base",
  lg: "px-4 py-3 text-lg",
};

const variantStyles: Record<string, string> = {
  default: "bg-abyss-400/40",
  light: "bg-abyss-500/30",
};

export function MetricCard({
  label,
  value,
  accent = "brass",
  size = "md",
  variant = "default",
  suffix,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "border-l-2 rounded-md flex flex-col gap-1",
        accentStyles[accent],
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
    >
      <span className="text-xs text-starlight uppercase tracking-wider">{label}</span>
      <span className="font-semibold font-mono">
        {value ?? "—"}{suffix ? <span className="text-xs text-starlight ml-0.5">{suffix}</span> : null}
      </span>
    </div>
  );
}
