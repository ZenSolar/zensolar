import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Props {
  currentPrice: number;
  isAdmin: boolean;
  onUpdated: () => void;
}

export function PriceAdminPanel({ currentPrice, isAdmin, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentPrice.toString());
  const [busy, setBusy] = useState(false);

  if (!isAdmin) return null;

  const save = async () => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      toast.error("Enter a valid price");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("vault_state")
      .update({
        current_price_usd: num,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    setBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Live price updated");
      setEditing(false);
      onUpdated();
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-1"
      >
        <Pencil className="h-3 w-3" />
        Edit live price
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-8 w-24 text-sm"
        autoFocus
      />
      <Button size="sm" onClick={save} disabled={busy} className="h-8">
        {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          setEditing(false);
          setValue(currentPrice.toString());
        }}
        className="h-8"
      >
        Cancel
      </Button>
    </div>
  );
}
