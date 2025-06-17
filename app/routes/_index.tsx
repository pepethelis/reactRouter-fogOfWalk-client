import { XIcon } from "lucide-react";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import Map from "~/components/map";
import { SelectFilesDialog } from "~/components/select-files-dialog";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
} from "~/components/ui/sidebar";
import type { Track } from "~/types";
import { calculateTrackLengthWithUnits } from "~/utils/calculate-track-length";
import { parseActivityFiles } from "~/utils/unified-parser";

export function meta() {
  return [
    { title: "Fog of Walk" },
    { name: "description", content: "Multiple fit/gpx files visualizer" },
  ];
}

export default function Home() {
  const [parsedTracks, setParsedTracks] = useState<Track[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const selectedTrack = useMemo(() => {
    return parsedTracks.find((track) => track.id === selectedTrackId) || null;
  }, [parsedTracks, selectedTrackId]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      try {
        console.log(`Processing ${target.files.length} files...`);
        const newTracks = await parseActivityFiles(target.files);
        console.log(`Successfully parsed ${newTracks.length} tracks`);
        setParsedTracks((prevTracks) => [...prevTracks, ...newTracks]);
      } catch (error) {
        console.error("Error parsing files:", error);
      } finally {
        target.value = "";
      }
    }
  };

  const handleSelectFilesClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearTracksClick = () => {
    setParsedTracks([]);
    setSelectedTrackId(null);
  };

  return (
    <>
      <input
        multiple
        type="file"
        accept=".fit,.gpx,application/gpx+xml,application/octet-stream"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      <SelectFilesDialog
        isOpen={parsedTracks.length === 0}
        onSelectFilesCLick={handleSelectFilesClick}
      />

      <SidebarProvider
        style={
          {
            "--sidebar-width": "24rem",
          } as CSSProperties
        }
        open={!!selectedTrackId}
      >
        <div className="relative flex w-full">
          <Sidebar>
            <SidebarHeader className="flex items-end">
              <Button
                aria-label="Close"
                size="icon"
                variant="ghost"
                onClick={() => setSelectedTrackId(null)}
              >
                <XIcon />
              </Button>
            </SidebarHeader>
            <SidebarContent className="p-4">
              {!!selectedTrack && (
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
                    <div className="grid">
                      <span className="text-muted-foreground text-sm">
                        Distance
                      </span>
                      <span className="text-lg">
                        {calculateTrackLengthWithUnits(
                          selectedTrack
                        ).kilometers.toFixed(2)}
                        km
                      </span>
                    </div>
                    <Separator orientation="vertical" />
                    <div className="grid">
                      <span className="text-muted-foreground text-sm">
                        Pace
                      </span>
                      <span className="text-lg">unknown</span>
                    </div>
                    <Separator orientation="vertical" />
                    <div className="grid">
                      <span className="text-muted-foreground text-sm">
                        Time
                      </span>
                      <span className="text-lg">unknown</span>
                    </div>
                  </div>
                </>
              )}
            </SidebarContent>
          </Sidebar>
          <main className="relative h-screen flex-grow flex">
            <div className="z-0 w-full">
              <Map
                tracks={parsedTracks}
                selectedTrack={selectedTrack}
                onTrackClick={(track) => setSelectedTrackId(track.id || null)}
              />
            </div>
            {parsedTracks.length > 0 && (
              <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-4">
                <Button variant="secondary" onClick={handleSelectFilesClick}>
                  Add other tracks
                </Button>
                <Button variant="secondary" onClick={handleClearTracksClick}>
                  Clear tracks
                </Button>
              </div>
            )}
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}
