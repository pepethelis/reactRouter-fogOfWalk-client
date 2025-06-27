import type { ReactNode } from "react";
import { Separator } from "./ui/separator";

type StatsGridProps = {
  items: Array<{
    label: string;
    value: ReactNode;
  }>;
};

export const StatsGrid = ({ items }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 mt-10 text-sm text-center gap-y-8">
      {items.map((item, i) => (
        <div
          key={i}
          className="grid relative [&:nth-child(2n+1)>div:first-child]:hidden sm:[&:nth-child(2n+1)>div:first-child]:grid sm:[&:nth-child(3n+1)>div:first-child]:hidden"
        >
          <Separator
            orientation="vertical"
            className="absolute inset-0 right-auto my-auto"
          />
          <span className="text-muted-foreground text-sm">{item.label}</span>
          <span className="text-lg">{item.value}</span>
        </div>
      ))}
    </div>
  );
};
