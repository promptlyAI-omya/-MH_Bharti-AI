import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function Card({
  children,
  className = "",
  hover = true,
  glow = false,
}: CardProps) {
  return (
    <div
      className={`glass rounded-xl p-4 ${hover ? "card-hover" : ""} ${
        glow ? "saffron-glow" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
