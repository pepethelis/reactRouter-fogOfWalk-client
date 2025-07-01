import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "./ui/button";

type SelectFilesDialogProps = {
  isOpen: boolean;
  onSelectFilesCLick: () => void;
};

export function SelectFilesDialog({
  isOpen,
  onSelectFilesCLick,
}: SelectFilesDialogProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="z-50" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Please select your .fit, .kml or .gpx files</DialogTitle>
          <DialogDescription>
            Some useless description which won't be read by anyone. It is needed
            just to make the app appear more complex than it actually is.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <Button onClick={onSelectFilesCLick} className="w-full">
            Select Files
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
