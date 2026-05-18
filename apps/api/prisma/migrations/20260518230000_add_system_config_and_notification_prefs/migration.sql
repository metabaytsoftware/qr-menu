-- Migration: add_system_config_and_notification_prefs
-- Creates two new tables: system_configs and user_notification_preferences

-- ─── SystemConfig ────────────────────────────────────────────────────────────
CREATE TABLE "system_configs" (
    "id"          TEXT NOT NULL,
    "key"         TEXT NOT NULL,
    "value"       TEXT NOT NULL,
    "is_secret"   BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updated_at"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- ─── UserNotificationPreferences ─────────────────────────────────────────────
CREATE TABLE "user_notification_preferences" (
    "id"           TEXT NOT NULL,
    "user_id"      TEXT NOT NULL,
    "email_enabled"  BOOLEAN NOT NULL DEFAULT true,
    "sms_enabled"    BOOLEAN NOT NULL DEFAULT false,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "push_enabled"   BOOLEAN NOT NULL DEFAULT false,
    "event_prefs"  JSONB,
    "updated_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_notification_preferences_user_id_key"
    ON "user_notification_preferences"("user_id");

ALTER TABLE "user_notification_preferences"
    ADD CONSTRAINT "user_notification_preferences_user_id_fkey"
    FOREIGN KEY ("user_id")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;
