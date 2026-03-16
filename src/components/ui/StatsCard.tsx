import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  color?: string;
  bgColor?: string;
}

export default function StatsCard({
  icon: Icon,
  value,
  label,
  color = "text-saffron",
  bgColor = "bg-saffron/10",
}: StatsCardProps) {
  return (
    <div className="glass rounded-xl p-3.5 card-hover">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}
        >
          <Icon size={16} className={color} />
        </div>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}
