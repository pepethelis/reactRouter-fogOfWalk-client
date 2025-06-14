import { useRef, useState } from "react";
import DynamicMap from "~/components/dynamic-map";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import type { Track } from "~/types";
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

      <Dialog open={parsedTracks.length === 0}>
        <DialogContent className="z-50" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Please select your .fit or .gpx files</DialogTitle>
            <DialogDescription>
              Some useless description which won't be read by anyone. It is
              needed just to make the app appear more complex than it actually
              is.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <Button onClick={handleSelectFilesClick} className="w-full">
              Select Files
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="relative h-screen w-screen">
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
        <DynamicMap tracks={parsedTracks} />
      </div>
    </>
  );
}
