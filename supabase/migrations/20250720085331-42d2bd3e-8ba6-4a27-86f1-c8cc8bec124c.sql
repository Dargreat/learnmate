-- Add video progress tracking to user_progress table
ALTER TABLE public.user_progress 
ADD COLUMN IF NOT EXISTS video_progress INTEGER DEFAULT 0 CHECK (video_progress >= 0 AND video_progress <= 100);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_tutorial ON public.user_progress(user_id, tutorial_id);