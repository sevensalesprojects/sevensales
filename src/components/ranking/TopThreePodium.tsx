import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

interface PodiumEntry {
  name: string;
  avatarUrl?: string | null;
  mainValue: string;
  mainLabel: string;
  secondaryValue?: string;
  secondaryLabel?: string;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function PodiumPlace({ entry, position }: { entry: PodiumEntry; position: 1 | 2 | 3 }) {
  const heights: Record<number, string> = { 1: "h-32", 2: "h-24", 3: "h-20" };
  const avatarSizes: Record<number, string> = { 1: "h-16 w-16", 2: "h-12 w-12", 3: "h-12 w-12" };
  const badgeColors: Record<number, string> = {
    1: "bg-yellow-400/20 text-yellow-400 border-yellow-400/40",
    2: "bg-gray-300/20 text-gray-300 border-gray-300/40",
    3: "bg-orange-400/20 text-orange-400 border-orange-400/40",
  };
  const glowColors: Record<number, string> = {
    1: "shadow-[0_0_30px_rgba(250,204,21,0.15)]",
    2: "shadow-[0_0_20px_rgba(156,163,175,0.1)]",
    3: "shadow-[0_0_20px_rgba(251,146,60,0.1)]",
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${position === 1 ? "order-2" : position === 2 ? "order-1" : "order-3"}`}>
      {/* Avatar */}
      <div className="relative">
        <Avatar className={`${avatarSizes[position]} border-2 ${position === 1 ? "border-yellow-400/50" : position === 2 ? "border-gray-400/50" : "border-orange-400/50"} ${glowColors[position]}`}>
          <AvatarImage src={entry.avatarUrl || undefined} />
          <AvatarFallback className="bg-muted text-muted-foreground text-sm font-semibold">
            {getInitials(entry.name)}
          </AvatarFallback>
        </Avatar>
        <span className={`absolute -bottom-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border ${badgeColors[position]}`}>
          {position}
        </span>
      </div>

      {/* Name */}
      <span className="text-xs font-medium text-foreground max-w-[100px] truncate text-center">{entry.name}</span>

      {/* Podium block */}
      <div className={`${heights[position]} w-24 sm:w-28 rounded-t-lg flex flex-col items-center justify-center gap-0.5 ${
        position === 1
          ? "bg-gradient-to-t from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20"
          : position === 2
          ? "bg-gradient-to-t from-gray-400/10 to-gray-400/5 border border-gray-400/20"
          : "bg-gradient-to-t from-orange-500/10 to-orange-500/5 border border-orange-500/20"
      }`}>
        {position === 1 && <Trophy className="w-4 h-4 text-yellow-400/70 mb-1" />}
        <span className="text-sm font-bold text-foreground">{entry.mainValue}</span>
        <span className="text-[10px] text-muted-foreground">{entry.mainLabel}</span>
        {entry.secondaryValue && (
          <span className="text-[10px] text-muted-foreground mt-0.5">{entry.secondaryValue} {entry.secondaryLabel}</span>
        )}
      </div>
    </div>
  );
}

export function TopThreePodium({ entries, title }: { entries: PodiumEntry[]; title: string }) {
  if (entries.length === 0) return null;

  const top3 = entries.slice(0, 3);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-sm font-semibold text-foreground text-center mb-6">{title}</h3>
      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {top3.map((entry, i) => (
          <PodiumPlace key={i} entry={entry} position={(i + 1) as 1 | 2 | 3} />
        ))}
      </div>
    </div>
  );
}
