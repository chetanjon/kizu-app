-- "Your music app": the single app a person listens in (spotify | youtubeMusic |
-- apple), so a song drop opens straight in their app. One value (people live in
-- one app), nullable = no preference yet → the drop falls back to showing the
-- top 2 platform pills. Slug matches the platform_links key Odesli stores.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS music_app TEXT;
