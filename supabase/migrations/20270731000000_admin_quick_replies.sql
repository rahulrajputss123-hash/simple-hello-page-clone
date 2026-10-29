-- Admin Quick Replies for Tickets
-- This table stores pre-defined reply templates that admins can use when responding to tickets

create table if not exists public.admin_quick_replies (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) >= 2 and char_length(title) <= 50),
  content text not null check (char_length(content) >= 5 and char_length(content) <= 500),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for faster lookups
create index if not exists idx_admin_quick_replies_created_by on public.admin_quick_replies(created_by);

-- RLS policies
alter table public.admin_quick_replies enable row level security;

-- SELECT policy: admin, finance, and support can view all quick replies
create policy "Staff can view quick replies"
  on public.admin_quick_replies
  for select
  using (
    has_role(auth.uid(), 'admin'::public.app_role)
    or has_role(auth.uid(), 'finance'::public.app_role)
    or has_role(auth.uid(), 'support'::public.app_role)
  );

-- No INSERT/UPDATE/DELETE policies - writes go through server functions using service role

-- Update support_tickets status constraint to include 'in_progress'
do $$ 
begin
  -- Drop existing constraint if it exists
  alter table public.support_tickets 
  drop constraint if exists support_tickets_status_check;
  
  -- Add new constraint with all three statuses
  alter table public.support_tickets 
  add constraint support_tickets_status_check 
  check (status in ('open', 'in_progress', 'resolved'));
exception
  when undefined_table then null;
end $$;

comment on table public.admin_quick_replies is 'Pre-defined reply templates for admin ticket responses';
comment on column public.admin_quick_replies.title is 'Short title/label for the quick reply';
comment on column public.admin_quick_replies.content is 'The reply message content';
