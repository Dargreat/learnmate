import React, { useRef, useState } from 'react';
import { Upload, X, File, Video, Image, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useFileStorage } from '@/hooks/useFileStorage';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileUploaded?: (url: string, fileName: string) => void;
  onFileRemoved?: () => void;
  bucket: 'tutorial-videos' | 'tutorial-attachments' | 'user-uploads';
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  currentFile?: string;
  placeholder?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  onFileRemoved,
  bucket,
  accept = "*",
  maxSize = 50,
  className,
  disabled = false,
  currentFile,
  placeholder = "Click to upload or drag and drop"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { uploadFile, deleteFile, uploadProgress } = useFileStorage();

  const handleFileSelect = async (file: File) => {
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    const userPath = bucket === 'user-uploads' ? `${Date.now()}` : undefined;
    const url = await uploadFile(file, bucket, userPath);
    
    if (url && onFileUploaded) {
      onFileUploaded(url, file.name);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemoveFile = async () => {
    if (currentFile && onFileRemoved) {
      // Extract path from URL for deletion
      const url = new URL(currentFile);
      const path = url.pathname.split('/').slice(-1)[0];
      
      const success = await deleteFile(bucket, path);
      if (success) {
        onFileRemoved();
      }
    }
  };

  const getFileIcon = (fileName?: string) => {
    if (!fileName) return <Upload className="h-8 w-8" />;
    
    const extension = fileName.toLowerCase().split('.').pop();
    
    if (['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(extension || '')) {
      return <Video className="h-8 w-8" />;
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '')) {
      return <Image className="h-8 w-8" />;
    }
    
    return <File className="h-8 w-8" />;
  };

  if (currentFile) {
    return (
      <div className={cn("relative border-2 border-dashed border-muted rounded-lg p-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getFileIcon(currentFile)}
            <div>
              <p className="font-medium">File uploaded</p>
              <p className="text-sm text-muted-foreground truncate">
                {currentFile.split('/').pop()?.split('-').slice(1).join('-') || 'Unknown file'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveFile}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className={cn(
          "relative border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragging && "border-primary bg-primary/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
        />
        
        {uploadProgress.isUploading ? (
          <div className="space-y-4">
            <Upload className="h-8 w-8 mx-auto text-primary animate-pulse" />
            <div>
              <p className="text-sm font-medium">Uploading...</p>
              <Progress value={uploadProgress.percentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {uploadProgress.percentage}%
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{placeholder}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum file size: {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};