/**
 * Survey Profile Card
 * 
 * Prompt users to fill their demographic profile for better survey targeting.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSurveyProfile, saveSurveyProfile } from "@/lib/surveys/survey-profile.functions";
import type { SurveyProfile } from "@/lib/surveys/survey-profile.functions";

export function SurveyProfileCard() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getSurveyProfile);
  const saveProfile = useServerFn(saveSurveyProfile);

  const { data: profile } = useQuery({
    queryKey: ["survey-profile"],
    queryFn: () => fetchProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const mutation = useMutation({
    mutationFn: (data: SurveyProfile) => saveProfile({ data }),
    onSuccess: () => {
      // Invalidate and immediately refetch all survey queries
      queryClient.invalidateQueries({ queryKey: ["survey-profile"] });
      queryClient.invalidateQueries({ queryKey: ["surveys-home-feed"] });
      queryClient.invalidateQueries({ queryKey: ["survey-feed"] });
      
      // Force immediate refetch of home surveys
      queryClient.refetchQueries({ queryKey: ["surveys-home-feed"] });
      
      // Force refetch of any active quest survey feeds
      queryClient.refetchQueries({ 
        queryKey: ["survey-feed"],
        type: "active" 
      });
      
      setOpen(false);
    },
  });

  // Don't show if profile already exists
  if (profile) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 text-left transition-transform active:scale-[0.98]"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
          <UserCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">
            Complete your profile for better surveys
          </div>
          <div className="text-xs text-muted-foreground">
            Fill in your details
          </div>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Survey Profile</DialogTitle>
            <DialogDescription>
              Share your details to receive better targeted surveys.
              <br />
              <span className="text-xs text-muted-foreground">
                These details will be shared with survey partners.
              </span>
            </DialogDescription>
          </DialogHeader>

          <SurveyProfileForm
            onSubmit={(data) => mutation.mutate(data)}
            isLoading={mutation.isPending}
            error={mutation.error}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function SurveyProfileForm({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (data: SurveyProfile) => void;
  isLoading: boolean;
  error: Error | null;
}) {
  const [birthDate, setBirthDate] = useState<string>("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("IN");
  const [clientError, setClientError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setClientError("");

    // Validate birth date
    if (!birthDate) {
      setClientError("Birth date is required");
      return;
    }

    // Calculate age
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    // Validate age (13-100 years)
    if (age < 13) {
      setClientError("You must be at least 13 years old to complete surveys");
      return;
    }

    if (age > 100) {
      setClientError("Please enter a valid birth date");
      return;
    }

    onSubmit({
      birthDate,
      gender,
      postalCode: postalCode || undefined,
      countryCode,
    });
  };

  // Calculate max and min dates for the date picker
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
    .toISOString()
    .split("T")[0];
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate())
    .toISOString()
    .split("T")[0];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Birth Date */}
      <div className="space-y-2">
        <Label htmlFor="birth-date">Date of Birth</Label>
        <Input
          id="birth-date"
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          min={minDate}
          max={maxDate}
          required
        />
        <p className="text-xs text-muted-foreground">
          You must be between 13 and 100 years old
        </p>
      </div>

      {/* Gender */}
      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select value={gender} onValueChange={(v) => setGender(v as "male" | "female")}>
          <SelectTrigger id="gender">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Postal Code */}
      <div className="space-y-2">
        <Label htmlFor="postal-code">Postal Code (Optional)</Label>
        <Input
          id="postal-code"
          type="text"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="110001"
        />
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select value={countryCode} onValueChange={setCountryCode}>
          <SelectTrigger id="country">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="IN">India (IN)</SelectItem>
            <SelectItem value="US">United States (US)</SelectItem>
            <SelectItem value="GB">United Kingdom (GB)</SelectItem>
            <SelectItem value="CA">Canada (CA)</SelectItem>
            <SelectItem value="AU">Australia (AU)</SelectItem>
            <SelectItem value="DE">Germany (DE)</SelectItem>
            <SelectItem value="FR">France (FR)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client-side validation errors */}
      {clientError && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {clientError}
        </div>
      )}

      {/* Server errors */}
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error.message || "Failed to save profile. Please check your inputs."}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        By submitting, you consent to sharing this information with survey partners for better targeting.
      </p>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
