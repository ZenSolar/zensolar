import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { downloadCsv, type CsvRow } from "@/lib/csvExport";
import { cn } from "@/lib/utils";

interface ExportCsvButtonProps {
  /** File name without extension — ".csv" is appended. */
  filename: string;
  /** Lazy data resolver — called only when the user clicks. */
  getRows: () => Promise<{ rows: CsvRow[]; columns?: string[] }> | { rows: CsvRow[]; columns?: string[] };
  label?: string;
  disabled?: boolean;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}

/**
 * Pass D · #3 — generic CSV export button.
 *
 * Loads its rows on click (so we don't pay the cost for users who never
 * export), shows a tiny spinner while resolving, then triggers the
 * download. Emits a success/empty/failure toast.
 */
export function ExportCsvButton({
  filename,
  getRows,
  label = "Export CSV",
  disabled,
  variant = "outline",
  size = "sm",
  className,
}: ExportCsvButtonProps) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const result = await getRows();
      const { rows, columns } = result;
      if (!rows.length) {
        toast.info("Nothing to export yet");
        return;
      }
      downloadCsv(`${filename}.csv`, rows, columns);
      toast.success(`Exported ${rows.length.toLocaleString()} row${rows.length === 1 ? "" : "s"}`);
    } catch (err) {
      console.error("[ExportCsvButton] export failed:", err);
      toast.error("Couldn't export — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={busy || disabled}
      className={cn("gap-1.5", className)}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      <span>{label}</span>
    </Button>
  );
}
