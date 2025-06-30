import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import type { Point, Track } from "~/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart";
import { cn } from "~/lib/utils/ui/classnames";
import { haversineDistance } from "~/lib/utils/geo/calculations/haversine-distance";
import { removeOutliersAndSmooth } from "~/lib/utils/geo/processing/smooth-elevation";

type SpeedChartProps = {
  track: Track;
  className?: string;
};

const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance)}m`;
  }
  return `${(distance / 1000).toFixed(1)}km`;
};

const formatSpeed = (speed: number): string => {
  return `${speed.toFixed(1)} km/h`;
};

const calculateSpeed = (point1: Point, point2: Point): number => {
  if (!point1.time || !point2.time) {
    return 0;
  }

  const distance = haversineDistance(point1, point2); // meters

  const time1 = new Date(point1.time).getTime();
  const time2 = new Date(point2.time).getTime();
  const timeDiff = Math.abs(time2 - time1) / 1000; // seconds

  if (timeDiff === 0) {
    return 0;
  }

  const speedMps = distance / timeDiff; // meters per second
  const speedKmh = speedMps * 3.6; // km/h

  return speedKmh;
};

export const SpeedChart: React.FC<SpeedChartProps> = ({ track, className }) => {
  const chartData = React.useMemo(() => {
    if (!track.points || track.points.length < 2) {
      return [];
    }

    const rawData = [];
    let cumulativeDistance = 0;

    for (let i = 1; i < track.points.length; i++) {
      const currentPoint = track.points[i];
      const prevPoint = track.points[i - 1];

      const distance = haversineDistance(prevPoint, currentPoint);
      cumulativeDistance += distance;

      const speed = calculateSpeed(prevPoint, currentPoint);

      // Only include points with valid speed data
      if (speed > 0 && speed < 200) {
        // Filter out unrealistic speeds (> 200 km/h)
        rawData.push({
          distance: cumulativeDistance,
          speed: speed,
          index: i,
        });
      }
    }

    if (rawData.length === 0) {
      return [];
    }

    const speeds = rawData.map((d) => d.speed);
    let smoothedSpeeds: number[];

    try {
      smoothedSpeeds = removeOutliersAndSmooth(speeds);
    } catch {
      // Fallback if smoothing fails
      smoothedSpeeds = speeds;
    }

    return rawData.map((point, i) => ({
      ...point,
      smoothedSpeed: smoothedSpeeds[i],
      originalSpeed: point.speed,
    }));
  }, [track.points]);

  const yAxisDomain = React.useMemo(() => {
    if (chartData.length === 0) {
      return undefined;
    }

    const speeds = chartData.map((d) => d.smoothedSpeed);
    const minSpeed = Math.min(...speeds);
    const maxSpeed = Math.max(...speeds);

    // Add some padding to the domain
    const padding = (maxSpeed - minSpeed) * 0.1;
    return [Math.max(0, minSpeed - padding), maxSpeed + padding];
  }, [chartData]);

  const chartConfig: ChartConfig = {
    speed: {
      label: "Speed",
      color: "hsl(var(--chart-2))",
    },
  };

  if (chartData.length === 0) {
    return (
      <div className={className}>
        <div className="text-center text-muted-foreground py-8">
          No speed data available for this track
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
        <YAxis tickFormatter={formatSpeed} domain={yAxisDomain} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={() => "Speed"}
              formatter={(value) =>
                formatSpeed(typeof value === "number" ? value : 0)
              }
            />
          }
        />
        <Line
          type="monotone"
          dataKey="smoothedSpeed"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
};
