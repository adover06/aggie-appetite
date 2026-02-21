"use client";

interface FilterChipsProps {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function FilterChips({
  label,
  options,
  selected,
  onToggle,
}: FilterChipsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className={`cursor-pointer rounded-full px-3.5 py-2 text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "bg-white text-foreground border border-border hover:border-primary/40 hover:bg-primary-light/30"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
