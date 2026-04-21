import { Button } from "@/components/ui/button";

interface Props {
  current: number;
  targets: { price: number; label: string }[];
  selected: number | null;
  onSelect: (price: number | null) => void;
}

export function PriceScenarioToggle({ current, targets, selected, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Price scenario
        </span>
        {selected !== null && (
          <button
            onClick={() => onSelect(null)}
            className="text-[10px] text-primary hover:underline"
          >
            Reset to live (${current.toFixed(2)})
          </button>
        )}
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {targets.map((t) => {
          const active = selected === t.price;
          return (
            <Button
              key={t.price}
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => onSelect(active ? null : t.price)}
              className="shrink-0 snap-start text-xs h-8"
            >
              ${t.price.toFixed(t.price < 10 ? 2 : 0)}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
