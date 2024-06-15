import {
  RadialBar,
  RadialBarChart,
  Legend,
  ResponsiveContainer,
  type LegendPayload,
} from "recharts";

import { formatCurrency } from "@/lib/utils";

const COLORS = ["#0062FF", "#12C6FF", "#FF647F", "#FF9354"];

const getPayloadNumber = (payload: object | undefined, key: string) => {
  if (payload && key in payload) {
    return Number((payload as Record<string, unknown>)[key]);
  }

  return 0;
};

type Props = {
  data: {
    name: string;
    value: number;
  }[];
};

export const RadialVariant = ({ data }: Props) => {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadialBarChart
        cx="50%"
        cy="30%"
        barSize={10}
        innerRadius="90%" 
        outerRadius="40%"
        data={data.map((item, index) => ({
          ...item,
          fill: COLORS[index % COLORS.length]
        }))}
      >
        <RadialBar
          label={{ 
            position: "insideStart", 
            fill: "#fff",
            fontSize: "12px"
          }}
          background
          dataKey="value"
        />
        <Legend
          layout="horizontal"
          verticalAlign="bottom" 
          align="right"
          iconType="circle"
          content={({ payload }: { payload?: ReadonlyArray<LegendPayload> }) => {
            const items = payload ?? [];

            return (
              <ul className="flex flex-col space-y-2">
                {items.map((entry, index) => (
                  <li 
                    key={`item-${index}`}
                    className="flex items-center space-x-2"
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <div className="space-x-1">
                      <span className="text-sm text-muted-foreground">
                        {entry.value}
                      </span>
                      <span className="text-sm">
                        {formatCurrency(getPayloadNumber(entry.payload, "value"))}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )
          }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};
