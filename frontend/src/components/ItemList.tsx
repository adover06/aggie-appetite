"use client";

import { useState } from "react";
import type { IdentifiedItem } from "@/lib/types";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

interface ItemListProps {
  items: IdentifiedItem[];
  selectedItems: IdentifiedItem[];
  onToggle: (item: IdentifiedItem) => void;
  onRemove: (name: string) => void;
  onAddCustom: (name: string) => void;
}

export function ItemList({
  items,
  selectedItems,
  onToggle,
  onRemove,
  onAddCustom,
}: ItemListProps) {
  const [customInput, setCustomInput] = useState("");

  const selectedNames = new Set(selectedItems.map((i) => i.name));

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed) {
      onAddCustom(trimmed);
      setCustomInput("");
    }
  };

  return (
    <div className="space-y-3">
      {/* Item list */}
      {items.map((item) => {
        const isSelected = selectedNames.has(item.name);
        return (
          <div
            key={item.name}
            onClick={() => onToggle(item)}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
              isSelected
                ? "border-primary/30 bg-primary-light/30"
                : "border-border bg-card opacity-60"
            }`}
          >
            {/* Checkbox */}
            <div
              className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                isSelected
                  ? "border-primary bg-primary"
                  : "border-stone-300 bg-white"
              }`}
            >
              {isSelected && (
                <svg
                  className="h-3 w-3 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              )}
            </div>

            {/* Name */}
            <span className="flex-1 text-sm font-medium">{item.name}</span>

            {/* Confidence */}
            <span className="text-xs text-muted">
              {Math.round(item.confidence * 100)}%
            </span>

            {/* Source badge */}
            <Badge variant={item.source === "ASUCD Pantry" ? "success" : "info"}>
              {item.source === "ASUCD Pantry" ? "Pantry" : "Personal"}
            </Badge>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(item.name);
              }}
              className="rounded-lg p-1 text-muted hover:bg-stone-100 hover:text-danger"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        );
      })}

      {/* Add custom item */}
      <div className="flex gap-2 pt-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
          placeholder="Add an item manually..."
          className="h-11 flex-1 rounded-xl border border-border bg-white px-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary"
        />
        <Button
          variant="secondary"
          size="md"
          onClick={handleAddCustom}
          disabled={!customInput.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
