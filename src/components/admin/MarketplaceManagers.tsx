import { Check, ImageIcon, X } from "lucide-react";
import { useState } from "react";

import { SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  PreviewNotice,
  VerificationBadge,
  formatShortDate,
  previewOnly,
} from "@/components/marketplace/Preview";
import { formatMoney } from "@/lib/coinquest";
import {
  ADMIN_ADVERTISERS,
  ADMIN_PENDING_CAMPAIGNS,
  ADMIN_PENDING_PROOFS,
} from "@/lib/marketplace/data";

/**
 * Admin screens for the marketplace preview. Sample data only — Approve /
 * Reject / toggles show "Preview only — not saved". Reject always requires a
 * reason: for proof submissions this is the text the publisher sees under
 * "Reason for rejection" in My Submissions.
 */

function RejectBox({
  id,
  onCancel,
  onConfirm,
}: {
  id: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= 8;
  return (
    <div className="mt-3 space-y-2 rounded-2xl bg-destructive/5 p-3">
      <label htmlFor={`reject-${id}`} className="text-xs font-semibold text-destructive">
        Rejection reason (required)
      </label>
      <Textarea
        id={`reject-${id}`}
        rows={2}
        maxLength={300}
        placeholder="Explain clearly — this is shown to the other party."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="flex-1"
          disabled={!valid}
          data-testid={`confirm-reject-${id}`}
          onClick={() => onConfirm(reason.trim())}
        >
          Confirm rejection
        </Button>
      </div>
    </div>
  );
}

function ApproveReject({
  id,
  onApprove,
  onReject,
}: {
  id: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  return (
    <>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="mint"
          className="flex-1"
          data-testid={`approve-${id}`}
          onClick={onApprove}
        >
          <Check className="size-4" /> Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          data-testid={`reject-${id}`}
          onClick={() => setRejecting(true)}
        >
          <X className="size-4" /> Reject
        </Button>
      </div>
      {rejecting && (
        <RejectBox
          id={id}
          onCancel={() => setRejecting(false)}
          onConfirm={(reason) => {
            setRejecting(false);
            onReject(reason);
          }}
        />
      )}
    </>
  );
}

export function CampaignApprovals() {
  return (
    <>
      <SectionTitle action={<PreviewNotice />}>Campaign approvals</SectionTitle>
      <ul className="space-y-3" data-testid="admin-campaign-approvals">
        {ADMIN_PENDING_CAMPAIGNS.map((c) => (
          <li key={c.id} className="surface-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <VerificationBadge verification={c.verification} />
                <p className="mt-1.5 truncate font-semibold">{c.title}</p>
                <p className="text-xs text-muted-foreground">
                  by {c.advertiser} · {c.country} · submitted {formatShortDate(c.submittedAt)}
                </p>
              </div>
              <div className="shrink-0 text-right text-xs">
                <p className="text-amount text-sm text-gold-dark">{formatMoney(c.reward)}</p>
                <p className="text-muted-foreground">of {formatMoney(c.budget)} budget</p>
              </div>
            </div>
            <ApproveReject
              id={c.id}
              onApprove={() => previewOnly(`"${c.title}" would go live.`)}
              onReject={(reason) =>
                previewOnly(`The advertiser would be told: "${reason}"`)
              }
            />
          </li>
        ))}
      </ul>
    </>
  );
}

export function ProofReviews() {
  return (
    <>
      <SectionTitle action={<PreviewNotice />}>Proof submissions</SectionTitle>
      <p className="mb-3 text-xs text-muted-foreground">
        Rejection reasons are shown to the publisher and can be appealed from their My
        Submissions screen.
      </p>
      <ul className="space-y-3" data-testid="admin-proof-reviews">
        {ADMIN_PENDING_PROOFS.map((p) => (
          <li key={p.id} className="surface-card p-4">
            <div className="flex gap-3">
              <span
                aria-label="Uploaded screenshot (placeholder)"
                className="grid h-28 w-20 shrink-0 place-items-center rounded-xl border border-dashed border-border bg-background-alt text-muted-foreground"
              >
                <ImageIcon className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{p.campaign}</p>
                <p className="text-xs text-muted-foreground">
                  Publisher <strong>{p.publisher}</strong> · {formatShortDate(p.submittedAt)}
                </p>
                <p className="mt-2 rounded-xl bg-background-alt p-2 text-xs">
                  {p.notes ? `“${p.notes}”` : <em className="text-muted-foreground">No notes</em>}
                </p>
              </div>
            </div>
            <ApproveReject
              id={p.id}
              onApprove={() => previewOnly(`${p.publisher}'s reward would be credited.`)}
              onReject={(reason) =>
                previewOnly(`${p.publisher} would see: "${reason}"`)
              }
            />
          </li>
        ))}
      </ul>
    </>
  );
}

export function AdvertisersList() {
  return (
    <>
      <SectionTitle action={<PreviewNotice />}>Advertisers</SectionTitle>
      <div className="surface-card overflow-hidden" data-testid="admin-advertisers">
        <table className="w-full text-sm">
          <thead className="bg-background-alt text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Advertiser</th>
              <th className="px-3 py-2 text-right">Balance</th>
              <th className="px-3 py-2 text-right">Campaigns</th>
              <th className="px-3 py-2 text-right">Access</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ADMIN_ADVERTISERS.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-3">
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.email}</p>
                </td>
                <td className="text-amount px-3 py-3 text-right">{formatMoney(a.balance)}</td>
                <td className="px-3 py-3 text-right">{a.campaigns}</td>
                <td className="px-3 py-3 text-right">
                  <Switch
                    aria-label={a.approved ? "Restrict access" : "Approve access"}
                    checked={a.approved}
                    onCheckedChange={(next) =>
                      previewOnly(
                        next
                          ? `${a.name} would be approved to run campaigns.`
                          : `${a.name}'s access would be restricted.`,
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
          Toggle on = approved to run campaigns · off = access restricted
        </p>
      </div>
    </>
  );
}