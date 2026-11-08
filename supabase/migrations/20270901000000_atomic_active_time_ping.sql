-- Atomic active time ping function
-- Handles insert-or-update, token chain, gaps, daily cap, grace
-- This eliminates race conditions and 409 errors

CREATE OR REPLACE FUNCTION public.ping_active_time(
  p_user_id uuid,
  p_quest_key text,
  p_ping_token text,
  p_is_active boolean DEFAULT true
)
RETURNS TABLE (
  success boolean,
  reason text,
  next_token text,
  total_seconds integer,
  today_seconds integer,
  target_seconds integer,
  can_claim boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest record;
  v_progress record;
  v_now timestamptz := now();
  v_today_date date := (now() AT TIME ZONE 'UTC')::date;
  v_new_token text;
  v_seconds_to_credit integer := 0;
  v_gap_seconds numeric;
  v_is_first_ping boolean := false;
  v_new_total integer;
  v_new_today integer;
BEGIN
  -- Get quest config
  SELECT target_minutes, daily_cap_minutes, grace_minutes, is_active
  INTO v_quest
  FROM public.quests
  WHERE key = p_quest_key AND quest_type = 'active_time';

  IF NOT FOUND OR NOT v_quest.is_active THEN
    RETURN QUERY SELECT false, 'quest_not_found', null::text, 0, 0, 0, false;
    RETURN;
  END IF;

  -- Lock and get progress row (or detect it doesn't exist)
  SELECT *
  INTO v_progress
  FROM public.quest_active_time_progress
  WHERE user_id = p_user_id AND quest_key = p_quest_key
  FOR UPDATE;

  -- First ping: create row
  IF NOT FOUND THEN
    v_is_first_ping := true;
    v_new_token := encode(gen_random_bytes(24), 'base64');
    
    INSERT INTO public.quest_active_time_progress (
      user_id, quest_key, total_seconds, today_seconds, today_date,
      last_ping_at, last_ping_token, created_at, updated_at
    ) VALUES (
      p_user_id, p_quest_key, 0, 0, v_today_date,
      v_now, v_new_token, v_now, v_now
    );
    
    RAISE NOTICE 'FIRST_PING: user=% quest=% total=0', p_user_id, p_quest_key;
    
    RETURN QUERY SELECT true, 'first_ping', v_new_token, 0, 0, 
                        (v_quest.target_minutes * 60)::integer, false;
    RETURN;
  END IF;

  -- Already claimed?
  IF v_progress.credited_at IS NOT NULL THEN
    RETURN QUERY SELECT false, 'already_claimed', null::text,
                        v_progress.total_seconds, v_progress.today_seconds,
                        (v_quest.target_minutes * 60)::integer,
                        false;
    RETURN;
  END IF;

  -- Verify token (allow dummy UUID on first real ping for old rows)
  IF v_progress.last_ping_token IS NOT NULL 
     AND p_ping_token != v_progress.last_ping_token 
     AND p_ping_token != '00000000-0000-0000-0000-000000000000' THEN
    RETURN QUERY SELECT false, 'invalid_token', null::text,
                        v_progress.total_seconds, v_progress.today_seconds,
                        (v_quest.target_minutes * 60)::integer,
                        (v_progress.total_seconds >= v_quest.target_minutes * 60);
    RETURN;
  END IF;

  -- Check ping interval (min 20s)
  IF v_progress.last_ping_at IS NOT NULL THEN
    v_gap_seconds := EXTRACT(EPOCH FROM (v_now - v_progress.last_ping_at));
    
    IF v_gap_seconds < 20 THEN
      RETURN QUERY SELECT false, 'too_frequent', v_progress.last_ping_token,
                          v_progress.total_seconds, v_progress.today_seconds,
                          (v_quest.target_minutes * 60)::integer,
                          (v_progress.total_seconds >= v_quest.target_minutes * 60);
      RETURN;
    END IF;

    -- Calculate credit (min(gap, 35) or grace)
    IF v_progress.grace_until IS NOT NULL 
       AND v_now <= v_progress.grace_until 
       AND v_gap_seconds > 35 THEN
      -- In grace: credit up to grace_until
      v_seconds_to_credit := LEAST(
        v_gap_seconds,
        EXTRACT(EPOCH FROM (v_progress.grace_until - v_progress.last_ping_at))
      )::integer;
    ELSE
      -- Normal: credit min(gap, 35)
      v_seconds_to_credit := LEAST(v_gap_seconds, 35)::integer;
    END IF;
  ELSE
    -- No previous ping time, credit 0 (this shouldn't happen but handle it)
    v_seconds_to_credit := 0;
  END IF;

  -- Reset daily counter if new day
  IF v_progress.today_date != v_today_date THEN
    v_new_today := v_seconds_to_credit;
  ELSE
    v_new_today := v_progress.today_seconds + v_seconds_to_credit;
  END IF;

  -- Apply daily cap
  IF v_new_today > (v_quest.daily_cap_minutes * 60) THEN
    v_seconds_to_credit := GREATEST(0, (v_quest.daily_cap_minutes * 60) - v_progress.today_seconds);
    v_new_today := v_quest.daily_cap_minutes * 60;
  END IF;

  -- Calculate new totals
  v_new_total := v_progress.total_seconds + v_seconds_to_credit;
  v_new_token := encode(gen_random_bytes(24), 'base64');

  -- Update progress
  UPDATE public.quest_active_time_progress
  SET
    total_seconds = v_new_total,
    today_seconds = v_new_today,
    today_date = v_today_date,
    last_ping_at = v_now,
    last_ping_token = v_new_token,
    updated_at = v_now
  WHERE user_id = p_user_id AND quest_key = p_quest_key;

  RAISE NOTICE 'PING: user=% quest=% prev=% credit=% new=%', 
    p_user_id, p_quest_key, v_progress.total_seconds, v_seconds_to_credit, v_new_total;

  -- Return result
  RETURN QUERY SELECT 
    true,
    format('credited_%s_seconds', v_seconds_to_credit),
    v_new_token,
    v_new_total,
    v_new_today,
    (v_quest.target_minutes * 60)::integer,
    (v_new_total >= v_quest.target_minutes * 60);
END;
$$;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION public.ping_active_time TO service_role;

COMMENT ON FUNCTION public.ping_active_time IS 
'Atomic active time ping with SELECT FOR UPDATE lock. Creates row on first ping, validates token chain, credits min(gap,35s), handles grace periods and daily cap.';
