import { useMemo, useRef, useState } from "react";
import Map from "~/components/map";
import { SelectFilesDialog } from "~/components/select-files-dialog";
import { SelectedTrackSheet } from "~/components/selected-track-sheet";
import { Button } from "~/components/ui/button";
import { parseActivityFiles } from "~/lib/utils/parsers/unified-parser";
import type { Track } from "~/types";

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

      <div className="relative flex w-full">
        <SelectedTrackSheet
          selectedTrack={selectedTrack}
          onClose={() => setSelectedTrackId(null)}
        />
        <main className="relative h-screen flex-grow flex pointer-events-auto">
          <div className="z-0 w-full">
            <Map
              tracks={parsedTracks}
              selectedTrack={selectedTrack}
              onTrackClick={(track) => setSelectedTrackId(track.id || null)}
              onMapClick={() => setSelectedTrackId(null)}
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
    </>
  );
}
