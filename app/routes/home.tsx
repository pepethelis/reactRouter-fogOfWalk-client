import { useState } from "react";
import DynamicMap from "~/components/dynamic-map";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
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
    <>
      <Dialog open={parsedTracks.length === 0}>
        <DialogContent className="z-50" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Please select your .fit files</DialogTitle>
            <DialogDescription>
              Some useless description which won't be read by anyone. It is
              needed just to make the app appear more complex than it actually
              is.
            </DialogDescription>
          </DialogHeader>
          <div>
            <div className="grid w-full max-w-sm items-center gap-3">
              <Input
                type="file"
                multiple
                accept=".fit"
                onChange={async (event) => {
                  const target = event.target as HTMLInputElement;
                  if (target.files && target.files.length > 0) {
                    try {
                      console.log(
                        `Processing ${target.files.length} FIT files...`
                      );
                      const tracks = await parseFitFiles(target.files);
                      console.log(
                        `Successfully parsed ${tracks.length} tracks`
                      );

                      setParsedTracks(tracks);
                      console.log({ tracks });
                    } catch (error) {
                      console.error("Error parsing FIT files:", error);
                    }
                  }
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <div className="relative">
        <DynamicMap tracks={parsedTracks} />
      </div>
    </>
  );
}
