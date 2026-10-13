"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function uniqueNames(values: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export function CategoryField({
  value,
  onChange,
  suggestions,
  placeholder = "e.g. Hair, Apparel",
  listId,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  listId: string;
}) {
  const [newName, setNewName] = useState("");
  const names = useMemo(() => uniqueNames(suggestions), [suggestions]);
  const current = value.trim();
  const typed = newName.trim();

  function apply(name: string) {
    const next = name.trim();
    if (!next) return;
    onChange(next);
    setNewName("");
  }

  return (
    <div className="space-y-1.5">
      <Label>Category</Label>
      <Input
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <datalist id={listId}>
        {names.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              apply(typed);
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={!typed}
          onClick={() => apply(typed)}
        >
          <Plus className="size-4" />
          Add
        </Button>
      </div>
      {names.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {names.map((name) => {
            const active = current.toLowerCase() === name.toLowerCase();
            return (
              <button
                key={name}
                type="button"
                onClick={() => apply(name)}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                  active
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400",
                )}
              >
                {name}
              </button>
            );
          })}
        </div>
      ) : null}
      <p className="text-xs text-zinc-500">
        Click a name, pick from the list, or type a new one and press Add. Same
        names group together on the shop.
      </p>
    </div>
  );
}
