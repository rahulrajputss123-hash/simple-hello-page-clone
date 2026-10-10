/**
 * Role preference management for Phase 7
 * Persist publisher/advertiser mode preference across sessions
 */

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export type UserRole = "publisher" | "advertiser";

/**
 * Get user's preferred role
 */
const getPreferredRoleInput = z.object({
  userId: z.string().uuid(),
});

export const getPreferredRoleImpl = async (
  input: z.infer<typeof getPreferredRoleInput>
): Promise<UserRole | null> => {
  const { userId } = getPreferredRoleInput.parse(input);

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("preferred_role")
    .eq("id", userId)
    .single();

  if (error) throw new Error(`Failed to fetch preferred role: ${error.message}`);

  return (data?.preferred_role as UserRole) ?? null;
};

export const getPreferredRole = createServerFn({ method: "GET" })
  .validator(getPreferredRoleInput)
  .handler(({ data }) => getPreferredRoleImpl(data));

/**
 * Set user's preferred role
 */
const setPreferredRoleInput = z.object({
  userId: z.string().uuid(),
  role: z.enum(["publisher", "advertiser"]).nullable(),
});

export const setPreferredRoleImpl = async (
  input: z.infer<typeof setPreferredRoleInput>
): Promise<{ success: boolean }> => {
  const { userId, role } = setPreferredRoleInput.parse(input);

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ preferred_role: role })
    .eq("id", userId);

  if (error) throw new Error(`Failed to set preferred role: ${error.message}`);

  return { success: true };
};

export const setPreferredRole = createServerFn({ method: "POST" })
  .validator(setPreferredRoleInput)
  .handler(({ data }) => setPreferredRoleImpl(data));
