-- Enable 4-decimal precision for sub-cent rewards
-- (BitcoTasks 4 coins @ 1000/USD = $0.004, TimeWall $0.0025, etc.)

-- task_events.quantity stores the USD amount earned
-- Must support 4 decimals so $0.004 doesn't truncate to $0.00
ALTER TABLE public.task_events 
  ALTER COLUMN quantity TYPE numeric(12,4);

-- user_tasks.progress accumulates task_events.quantity
-- Must match task_events precision
ALTER TABLE public.user_tasks 
  ALTER COLUMN progress TYPE numeric(12,4);

-- user_tasks.target stores the goal (usually whole cents like 0.10)
-- 2 decimals sufficient but migrating to match wallet precision
-- (Already applied manually on production; included for repo consistency)
ALTER TABLE public.user_tasks 
  ALTER COLUMN target TYPE numeric(12,2);

-- Note: wallet_transactions.amount and wallet_balance are already numeric(14,4)
-- and wallet_apply/sdk_conversion_credit already use round(x, 4), so no changes needed there.
