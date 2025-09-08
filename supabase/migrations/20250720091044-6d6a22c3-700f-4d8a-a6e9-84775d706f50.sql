-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('tutorial-videos', 'tutorial-videos', true),
  ('tutorial-attachments', 'tutorial-attachments', true),
  ('user-uploads', 'user-uploads', false);

-- Create policies for tutorial videos (public access)
CREATE POLICY "Tutorial videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tutorial-videos');

CREATE POLICY "Authenticated users can upload tutorial videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'tutorial-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own tutorial videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'tutorial-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own tutorial videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'tutorial-videos' AND auth.uid() IS NOT NULL);

-- Create policies for tutorial attachments (public access)
CREATE POLICY "Tutorial attachments are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tutorial-attachments');

CREATE POLICY "Authenticated users can upload tutorial attachments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'tutorial-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own tutorial attachments" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'tutorial-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own tutorial attachments" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'tutorial-attachments' AND auth.uid() IS NOT NULL);

-- Create policies for user uploads (private access)
CREATE POLICY "Users can view their own uploads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own uploads" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own uploads" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);