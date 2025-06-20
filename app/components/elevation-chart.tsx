import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { Track } from "~/types";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
import { cn } from "~/lib/utils";
import { haversineDistance } from "~/utils/haversine-distance";
import { savitzkyGolaySmooth } from "~/utils/smooth-elevation";

type ElevationChartProps = {
  track: Track;
  className?: string;
};

const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

const formatElevation = (elevation: number): string => {
  return `${Math.round(elevation)}m`;
};

export const ElevationChart: React.FC<ElevationChartProps> = ({
  track,
  className,
}) => {
  const chartData = React.useMemo(() => {
    if (!track.points || track.points.length === 0) {
      return [];
    }

    // First, build the basic data with distances and elevations
    const rawData = [];
    let cumulativeDistance = 0;

    for (let i = 0; i < track.points.length; i++) {
      const point = track.points[i];

      if (i > 0) {
        const prevPoint = track.points[i - 1];
        const distance = haversineDistance(prevPoint, point);
        cumulativeDistance += distance;
      }

      if (point.asml !== undefined) {
        rawData.push({
          distance: cumulativeDistance,
          elevation: point.asml,
          index: i,
        });
      }
    }

    if (rawData.length === 0) {
      return [];
    }

    const elevations = rawData.map((d) => d.elevation);

    let smoothedElevations: number[];

    smoothedElevations = savitzkyGolaySmooth(elevations);

    return rawData.map((point, i) => ({
      ...point,
      smoothedElevation: smoothedElevations[i],
      originalElevation: point.elevation,
    }));
  }, [track.points]);

  const chartConfig = {
    elevation: {
      label: "Elevation",
      color: "hsl(var(--chart-1))",
    },
  };

  if (chartData.length === 0) {
    return (
      <div className={className}>
        <div className="text-center text-muted-foreground py-8">
          No elevation data available for this track
        </div>
      </div>
    );
  }

  return (
    <ChartContainer
      config={chartConfig}
      className={cn("h-64 w-full", className)}
    >
      <LineChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="distance" tickFormatter={formatDistance} />
        <YAxis tickFormatter={formatElevation} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(value) =>
                `Distance: ${formatDistance(
                  typeof value === "number" ? value : 0
                )}`
              }
              formatter={(value) => [
                formatElevation(typeof value === "number" ? value : 0),
                "Elevation",
              ]}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="elevation"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
};
