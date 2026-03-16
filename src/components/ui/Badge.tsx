import { ReactNode } from "react";

type BadgeVariant = "free" | "premium" | "exam" | "difficulty" | "custom";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  free: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
  premium: "bg-saffron/10 text-saffron border border-saffron/20",
  exam: "bg-navy/20 text-blue-300 border border-navy-200/20",
  difficulty: "bg-yellow-400/10 text-yellow-400 border border-yellow-400/20",
  custom: "",
};

export default function Badge({
  children,
  variant = "custom",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
