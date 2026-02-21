interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const color =
    score >= 8
      ? "from-green-500 to-emerald-600 text-white"
      : score >= 6
        ? "from-amber-400 to-orange-500 text-white"
        : "from-stone-400 to-stone-500 text-white";

  const sizes = {
    sm: "h-9 w-9 text-xs",
    md: "h-12 w-12 text-sm",
    lg: "h-14 w-14 text-base",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-full bg-gradient-to-br font-bold ${color} ${sizes[size]}`}
      title={`Academic Fuel Score: ${score}/10`}
    >
      <span className="leading-none">{score}</span>
      {size !== "sm" && (
        <span className="text-[9px] font-normal leading-none opacity-80">
          /10
        </span>
      )}
    </div>
  );
}
