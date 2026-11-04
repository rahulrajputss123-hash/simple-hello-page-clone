import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ActiveTimeStillHereDialogProps = {
  open: boolean;
  onConfirm: () => void;
};

/**
 * Modal that prompts user to confirm they're still actively using the app.
 * Shown after 10 minutes of inactivity during active time quest tracking.
 * If not confirmed within 60s, tracking pauses automatically.
 */
export function ActiveTimeStillHereDialog({ open, onConfirm }: ActiveTimeStillHereDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Still there?</AlertDialogTitle>
          <AlertDialogDescription>
            We haven't detected any activity for a while. Tap the button below to continue counting
            your active time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onConfirm}>Yes, I'm here!</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
