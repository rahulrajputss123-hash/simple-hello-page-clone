-- Add app_only column to quests table
-- Quests with app_only=true are hidden on web and blocked server-side for non-native requests

ALTER TABLE quests ADD COLUMN app_only boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN quests.app_only IS 'When true, quest is only shown and allowed in the native app. Hidden on web. Can be combined with any lock_type.';
