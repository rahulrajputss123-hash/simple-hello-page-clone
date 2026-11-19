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
      queryClient.invalidateQueries({ queryKey: ["survey-profile"] });
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
  const [day, setDay] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("IN");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate date inputs
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      alert("Please enter a valid day (1-31)");
      return;
    }

    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      alert("Please enter a valid month (1-12)");
      return;
    }

    const currentYear = new Date().getFullYear();
    if (isNaN(yearNum) || yearNum < currentYear - 99 || yearNum > currentYear - 1) {
      alert(`Please enter a valid year (${currentYear - 99} to ${currentYear - 1})`);
      return;
    }

    // Format as YYYY-MM-DD
    const birthDate = `${yearNum}-${monthNum.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;

    // Validate the date is real (e.g., not Feb 30)
    const dateObj = new Date(birthDate);
    if (
      dateObj.getFullYear() !== yearNum ||
      dateObj.getMonth() + 1 !== monthNum ||
      dateObj.getDate() !== dayNum
    ) {
      alert("Please enter a valid date");
      return;
    }

    onSubmit({
      birthDate,
      gender,
      postalCode: postalCode || undefined,
      countryCode,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Birth Date */}
      <div className="space-y-2">
        <Label>Date of Birth</Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Input
              type="number"
              min="1"
              max="31"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              placeholder="Day"
              required
            />
          </div>
          <div>
            <Input
              type="number"
              min="1"
              max="12"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              placeholder="Month"
              required
            />
          </div>
          <div>
            <Input
              type="number"
              min={new Date().getFullYear() - 99}
              max={new Date().getFullYear() - 1}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="Year"
              required
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Format: Day / Month / Year
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

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error.message || "Failed to save profile. Please check your inputs."}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
