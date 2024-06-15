import { format } from "date-fns";

import { formatCurrency } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type TooltipEntry = {
  value?: number | string;
  payload?: {
    date?: string | number | Date;
  };
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipEntry[];
};

export const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  const date = payload[0]?.payload?.date ?? new Date();
  const income = Number(payload[0]?.value ?? 0);
  const expenses = Number(payload[1]?.value ?? 0);

  return (
    <div className="rounded-sm bg-white shadow-sm border overflow-hidden">
      <div className="text-sm p-2 px-3 bg-muted text-muted-foreground">
        {format(date, "MMM dd, yyyy")}
      </div>
      <Separator />
      <div className="p-2 px-3 space-y-1">
        <div className="flex items-center justify-betwen gap-x-4">
          <div className="flex items-center gap-x-2">
            <div className="size-1.5 bg-pink-500 rounded-full" />
              <p className="text-sm text-muted-foreground">
                Income
              </p>
            </div>
            <p className="text-sm text-right font-medium">
              {formatCurrency(income)}
            </p>
        </div>
        <div className="flex items-center justify-betwen gap-x-4">
          <div className="flex items-center gap-x-2">
            <div className="size-1.5 bg-rose-500 rounded-full" />
              <p className="text-sm text-muted-foreground">
                Expenses
              </p>
            </div>
            <p className="text-sm text-right font-medium">
              {formatCurrency(expenses * -1)}
            </p>
        </div>
      </div>
    </div>
  );
};
