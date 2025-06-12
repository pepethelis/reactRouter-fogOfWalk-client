import { useState } from "react";
import DynamicMap from "~/components/dynamic-map";
import type { Track } from "~/types";
import { parseFitFiles } from "~/utils/fit";

export function meta() {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  const [parsedTracks, setParsedTracks] = useState<Track[]>([]);

  return (
    <div>
      <input
        type="file"
        multiple
        accept=".fit"
        onChange={async (event) => {
          const target = event.target as HTMLInputElement;
          if (target.files && target.files.length > 0) {
            try {
              console.log(`Processing ${target.files.length} FIT files...`);
              const tracks = await parseFitFiles(target.files);
              console.log(`Successfully parsed ${tracks.length} tracks`);

              setParsedTracks(tracks);
              console.log({ tracks });
            } catch (error) {
              console.error("Error parsing FIT files:", error);
            }
          }
        }}
      />
      <DynamicMap tracks={parsedTracks} />
    </div>
  );
}
