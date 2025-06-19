import type { Track } from "~/types";
import { getTrackMetrics } from "~/utils/calculate-track-metrics";
import { Sheet, SheetContent, SheetTitle } from "./ui/sheet";
import { StatsGrid } from "./stats-grid";

type SelectedTrackSheetProps = {
  selectedTrack: Track | null;
  onClose: () => void;
};

export const SelectedTrackSheet = ({
  selectedTrack,
  onClose,
}: SelectedTrackSheetProps) => {
  const metrics = selectedTrack ? getTrackMetrics(selectedTrack) : null;

  return (
    <Sheet
      open={!!selectedTrack}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent className="p-4" side="left" showOverlay={false}>
        {!!selectedTrack && metrics && (
          <>
            <div>
              <SheetTitle className="text-base">
                {selectedTrack.filename}
              </SheetTitle>
              <p className="text-muted-foreground text-sm">
                {selectedTrack.time?.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at{" "}
                {selectedTrack.time?.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: false,
                })}
              </p>
            </div>
            <div>
              <StatsGrid
                items={[
                  {
                    label: "Distance",
                    value: `${metrics.distance.kilometers.toFixed(2)}km`,
                  },
                  {
                    label: "Pace",
                    value: metrics.formattedPace,
                  },
                  {
                    label: "Time",
                    value: metrics.formattedDuration,
                  },
                  {
                    label: "Discovered",
                    value: metrics.formattedDiscoveredArea,
                  },
                  {
                    label: "Avg speed",
                    value: metrics.formattedAvgSpeed,
                  },
                  {
                    label: "Max speed",
                    value: metrics.formattedMaxSpeed,
                  },
                ]}
              />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
