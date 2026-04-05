-- Rollback 04: drop user_settings table
DROP TABLE IF EXISTS user_settings;
DROP FUNCTION IF EXISTS update_user_settings_updated_at();
