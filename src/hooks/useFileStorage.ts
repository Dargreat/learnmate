import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadProgress {
  percentage: number;
  isUploading: boolean;
}

export const useFileStorage = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ percentage: 0, isUploading: false });
  const { toast } = useToast();

  const uploadFile = async (
    file: File,
    bucket: string,
    path?: string,
    onProgress?: (progress: number) => void
  ): Promise<string | null> => {
    try {
      setUploadProgress({ percentage: 0, isUploading: true });
      
      // Create file path
      const timestamp = new Date().getTime();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = path ? `${path}/${fileName}` : fileName;

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setUploadProgress({ percentage: 100, isUploading: false });
      
      toast({
        title: "File uploaded successfully",
        description: `File uploaded to ${bucket}`,
      });

      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      setUploadProgress({ percentage: 0, isUploading: false });
      return null;
    }
  };

  const deleteFile = async (bucket: string, path: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: "Delete failed",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "File deleted successfully",
        description: `File removed from ${bucket}`,
      });

      return true;
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const getFileUrl = (bucket: string, path: string): string => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  };

  const listFiles = async (bucket: string, folder?: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 100,
          offset: 0
        });

      if (error) {
        console.error('List files error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  };

  return {
    uploadFile,
    deleteFile,
    getFileUrl,
    listFiles,
    uploadProgress
  };
};