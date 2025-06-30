import { useMemo, useRef, useState } from "react";
import Map, { mapStyles, type MapStyle } from "~/components/map";
import { SelectFilesDialog } from "~/components/select-files-dialog";
import { SelectedTrackSheet } from "~/components/selected-track-sheet";
import { Button } from "~/components/ui/button";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "~/components/ui/menubar";
import { Slider } from "~/components/ui/slider";
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
  const [fogOpacity, setFogOpacity] = useState(0.7);
  const [mapStyle, setMapStyle] = useState<MapStyle>("default");
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
              style={mapStyle}
              tracks={parsedTracks}
              selectedTrack={selectedTrack}
              fogOpacity={fogOpacity}
              onTrackClick={(track) => setSelectedTrackId(track.id || null)}
              onMapClick={() => setSelectedTrackId(null)}
            />
          </div>
          <Menubar className="absolute top-4 left-4 z-10">
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={handleSelectFilesClick}>
                  Add other tracks
                </MenubarItem>
                <MenubarItem onClick={handleClearTracksClick}>
                  Clear tracks
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent>
                <MenubarSub>
                  <MenubarSubTrigger>Fog opacity</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarRadioGroup
                      value={fogOpacity.toString()}
                      onValueChange={(value) =>
                        setFogOpacity(parseFloat(value))
                      }
                    >
                      <MenubarRadioItem value="0">Hidden</MenubarRadioItem>
                      <MenubarRadioItem value="0.5">50%</MenubarRadioItem>
                      <MenubarRadioItem value="0.7">70%</MenubarRadioItem>
                      <MenubarRadioItem value="0.8">80%</MenubarRadioItem>
                    </MenubarRadioGroup>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSub>
                  <MenubarSubTrigger>Map style</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarRadioGroup
                      value={mapStyle}
                      onValueChange={(value) => setMapStyle(value as MapStyle)}
                    >
                      {mapStyles.map((style) => (
                        <MenubarRadioItem key={style} value={style}>
                          {style}
                        </MenubarRadioItem>
                      ))}
                    </MenubarRadioGroup>
                  </MenubarSubContent>
                </MenubarSub>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </main>
      </div>
    </>
  );
}
