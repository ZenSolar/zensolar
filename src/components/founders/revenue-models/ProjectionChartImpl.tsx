import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProjectionRow } from "@/lib/revenueModelProjection";
import { fmtUsd } from "@/lib/revenueModelProjection";

interface Props {
  rows: ProjectionRow[];
  series: "lp" | "cash";
}

export default function ProjectionChartImpl({ rows, series }: Props) {
  const data = rows.map((r) => ({
    month: `M${r.month}`,
    "Model A": series === "lp" ? r.a_cumulativeLp : r.a_cash,
    "Model B": series === "lp" ? r.b_cumulativeLp : r.b_cash,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="hsl(var(--border) / 0.4)" strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => fmtUsd(Number(v))}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number) => fmtUsd(Number(value))}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="Model A"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="Model B"
            stroke="hsl(45 100% 60%)"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 3"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
