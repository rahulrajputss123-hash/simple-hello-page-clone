-- Enable pgcrypto extension for gen_random_bytes function
-- Used by quest_active_time_progress token generation

create extension if not exists pgcrypto with schema extensions;
