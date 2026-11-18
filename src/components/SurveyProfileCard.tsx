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
            Apni details bharein, behtar surveys paayein
          </div>
          <div className="text-xs text-muted-foreground">
            Profile complete karein
          </div>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Survey Profile</DialogTitle>
            <DialogDescription>
              Apni details share karein taaki aapko better surveys mil sakein.
              <br />
              <span className="text-xs text-muted-foreground">
                Yeh details survey partners ke saath share ki jaayengi.
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
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [postalCode, setPostalCode] = useState("");
  const [countryCode, setCountryCode] = useState("IN");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 99) {
      alert("Please enter a valid age (1-99)");
      return;
    }

    onSubmit({
      age: ageNum,
      gender,
      postalCode,
      countryCode,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Age */}
      <div className="space-y-2">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          type="number"
          min="1"
          max="99"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Enter your age"
          required
        />
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
        <Label htmlFor="postal-code">Postal Code</Label>
        <Input
          id="postal-code"
          type="text"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          placeholder="110001"
          required
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
          {error instanceof Error ? error.message : "Failed to save profile"}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save Profile"}
      </Button>
    </form>
  );
}
