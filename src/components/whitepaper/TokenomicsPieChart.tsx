import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins } from "lucide-react";

const data = [
  { name: 'User Rewards', value: 40, color: 'hsl(var(--primary))' },
  { name: 'Treasury', value: 20, color: 'hsl(142, 71%, 45%)' },
  { name: 'Liquidity Pool', value: 15, color: 'hsl(217, 91%, 60%)' },
  { name: 'Mint Burn', value: 10, color: 'hsl(0, 84%, 60%)' },
  { name: 'Team & Advisors', value: 10, color: 'hsl(262, 83%, 58%)' },
  { name: 'Community & Ecosystem', value: 5, color: 'hsl(36, 100%, 50%)' },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-semibold text-foreground">{d.name}</p>
        <p className="text-muted-foreground">{d.value}% · {(d.value / 100 * 10).toFixed(1)}B tokens</p>
      </div>
    );
  }
  return null;
};

export function TokenomicsPieChart() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="p-2 rounded-xl bg-primary/10">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          Token Distribution (10B Supply)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Chart */}
          <div className="w-full md:w-1/2 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} className="outline-none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="w-full md:w-1/2 space-y-2.5">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1 flex items-baseline justify-between gap-2">
                  <span className="text-sm text-foreground">{item.name}</span>
                  <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                    {item.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
