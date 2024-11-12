import { Suspense } from "react";
import { DataGrid } from "@/components/data-grid";
import { DataCharts } from "@/components/data-charts";

export default function DashboardPage() {
  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Suspense fallback={<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-2 mb-8"><div className="h-32 animate-pulse rounded-md bg-white/10" /><div className="h-32 animate-pulse rounded-md bg-white/10" /><div className="h-32 animate-pulse rounded-md bg-white/10" /></div>}>
        <DataGrid />
      </Suspense>
      <Suspense fallback={<div className="h-[300px] animate-pulse rounded-md bg-white/10" />}>
        <DataCharts />
      </Suspense>
    </div>
  );
};
