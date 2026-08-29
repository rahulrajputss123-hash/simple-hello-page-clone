import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LifeBuoy, PlayCircle } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { EmptyState, SectionTitle } from "@/components/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDateTime } from "@/lib/coinquest";
import { resetOnboarding } from "@/lib/onboarding/functions";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({
    meta: [
      { title: "Support — CashGPT" },
      { name: "description", content: "FAQs and support tickets for your CashGPT account." },
      { property: "og:title", content: "Support — CashGPT" },
      { property: "og:description", content: "FAQs and support tickets for your CashGPT account." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const replay = useServerFn(resetOnboarding);

  const replayAction = useMutation({
    mutationFn: () => replay({}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Tour will replay on the home screen.");
      navigate({ to: "/home" });
    },
    onError: () => toast.error("Couldn't reset the tour."),
  });

  const faq = useQuery({
    queryKey: ["faq"],
    queryFn: async () => {
      const { data } = await supabase.from("faq").select("*").order("sort_order");
      return data ?? [];
    },
  });

  const tickets = useQuery({
    queryKey: ["tickets", session?.user.id],
    enabled: Boolean(session),
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const createTicket = useMutation({
    mutationFn: async (values: { subject: string; description: string }) => {
      const { error } = await supabase
        .from("support_tickets")
        .insert({ user_id: session!.user.id, ...values });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Ticket submitted — we'll reply soon.");
      void queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: () => toast.error("Couldn't submit that ticket."),
  });

  return (
    <AppShell subtitle="Support">
      <h1 className="mt-2 text-2xl">Help centre</h1>

      <SectionTitle>Tips</SectionTitle>
      <div className="surface-card flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Replay the app tour</p>
          <p className="text-xs text-muted-foreground">
            See the quick spotlight walkthrough again.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={replayAction.isPending}
          onClick={() => replayAction.mutate()}
          data-testid="support-replay-tour-btn"
        >
          <PlayCircle className="mr-1 h-4 w-4" />
          {replayAction.isPending ? "…" : "Replay"}
        </Button>
      </div>

      <SectionTitle>FAQ</SectionTitle>
      <div className="surface-card px-4">
        <Accordion type="single" collapsible>
          {(faq.data ?? []).map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-left text-sm">{item.question}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <SectionTitle>Contact us</SectionTitle>
      <form
        className="surface-card space-y-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const subject = String(form.get("subject")).trim();
          const description = String(form.get("description")).trim();
          if (subject.length < 3 || description.length < 10) {
            toast.error("Add a subject and a bit more detail.");
            return;
          }
          createTicket.mutate({ subject, description });
          event.currentTarget.reset();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">How can we help?</Label>
          <Textarea id="description" name="description" maxLength={1000} rows={4} />
        </div>
        <Button type="submit" variant="jade" disabled={createTicket.isPending}>
          Submit ticket
        </Button>
      </form>

      <SectionTitle>Your tickets</SectionTitle>
      {!tickets.data?.length ? (
        <EmptyState
          icon={LifeBuoy}
          title="No tickets yet"
          description="Anything unclear? Send us a message above."
        />
      ) : (
        <ul className="space-y-2">
          {tickets.data.map((ticket) => (
            <li key={ticket.id} className="surface-card p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">{ticket.subject}</p>
                <span className="rounded-full bg-background-alt px-2.5 py-1 text-[11px] font-semibold capitalize">
                  {ticket.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(ticket.created_at)}</p>
              {ticket.admin_response && (
                <p className="mt-2 rounded-xl bg-background-alt p-2 text-sm">{ticket.admin_response}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
