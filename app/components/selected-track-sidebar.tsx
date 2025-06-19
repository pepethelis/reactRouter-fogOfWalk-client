import { XIcon } from "lucide-react";
import { Separator } from "~/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "~/components/ui/sidebar";
import { Button } from "./ui/button";
import type { Track } from "~/types";
import { getTrackMetrics } from "~/utils/calculate-track-metrics";

type SelectedTrackSidebarProps = {
  selectedTrack: Track | null;
  onClose: () => void;
};

export const SelectedTrackSidebar = ({
  selectedTrack,
  onClose,
}: SelectedTrackSidebarProps) => {
  const metrics = selectedTrack ? getTrackMetrics(selectedTrack) : null;

  return (
    <Sidebar>
      <SidebarHeader className="flex items-end">
        <Button
          aria-label="Close"
          size="icon"
          variant="ghost"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </SidebarHeader>
      <SidebarContent className="p-4">
        {!!selectedTrack && metrics && (
          <>
            <div>
              <h2 className="text-base">{selectedTrack.filename}</h2>
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
            <div className="mt-10 flex h-5 items-center gap-4 justify-around text-sm text-center">
              <div className="grid basis-1/3">
                <span className="text-muted-foreground text-sm">Distance</span>
                <span className="text-lg">
                  {metrics.distance.kilometers.toFixed(2)}km
                </span>
              </div>
              <Separator orientation="vertical" />
              <div className="grid basis-1/3">
                <span className="text-muted-foreground text-sm">Pace</span>
                <span className="text-lg">{metrics.formattedPace}</span>
              </div>
              <Separator orientation="vertical" />
              <div className="grid basis-1/3">
                <span className="text-muted-foreground text-sm">Time</span>
                <span className="text-lg">{metrics.formattedDuration}</span>
              </div>
            </div>
            <div className="mt-10 flex h-5 items-center gap-4 justify-around text-sm text-center">
              <div className="grid basis-1/3">
                <span className="text-muted-foreground text-sm">
                  Discovered
                </span>
                <span className="text-lg">
                  {metrics.formattedDiscoveredArea}
                </span>
              </div>
              <Separator orientation="vertical" />
              <div className="grid basis-1/3">
                <span className="text-muted-foreground text-sm">Avg speed</span>
                <span className="text-lg">{metrics.formattedAvgSpeed}</span>
              </div>
              <Separator orientation="vertical" />
              <div className="grid basis-1/3">
                <span className="text-muted-foreground text-sm">Max speed</span>
                <span className="text-lg">{metrics.formattedMaxSpeed}</span>
              </div>
            </div>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
};
