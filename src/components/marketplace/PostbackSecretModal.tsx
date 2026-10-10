import { CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PostbackSecretModalProps = {
  open: boolean;
  onClose: () => void;
  postbackUrl: string;
  postbackSecret: string;
  isRotation?: boolean;
};

export function PostbackSecretModal({
  open,
  onClose,
  postbackUrl,
  postbackSecret,
  isRotation = false,
}: PostbackSecretModalProps) {
  const [copied, setCopied] = useState<"url" | "secret" | null>(null);

  const copyToClipboard = async (text: string, type: "url" | "secret") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(`${type === "url" ? "URL" : "Secret"} copied to clipboard`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isRotation ? "Secret Rotated Successfully" : "Campaign Created Successfully"}
          </DialogTitle>
          <DialogDescription>
            {isRotation
              ? "Your postback secret has been rotated. The old secret will no longer work."
              : "Your campaign has been created. Save your postback credentials now."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-gold bg-gold/5 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-gold-dark">
              <span className="text-xl">⚠️</span>
              You will not see this secret again
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Save your postback URL and secret securely. You cannot retrieve them later, only rotate to a new secret.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Postback URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={postbackUrl}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(postbackUrl, "url")}
                className="shrink-0"
              >
                {copied === "url" ? (
                  <>
                    <CheckCircle2 className="size-4 text-mint" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" /> Copy
                  </>
                )}
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Use this URL to send postbacks from your tracking system. Replace {"{click_id}"} and {"{transaction_id}"}{" "}
              with actual values.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Secret Token</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={postbackSecret}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(postbackSecret, "secret")}
                className="shrink-0"
              >
                {copied === "secret" ? (
                  <>
                    <CheckCircle2 className="size-4 text-mint" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-4" /> Copy
                  </>
                )}
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              This token authenticates your postbacks. Keep it secure and never share it publicly.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="jade" className="w-full">
            I've saved my credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
