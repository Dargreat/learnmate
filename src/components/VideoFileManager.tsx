import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFileStorage } from '@/hooks/useFileStorage';
import { useSupabaseTutorials } from '@/hooks/useSupabaseTutorials';
import { 
  Trash2, 
  Download, 
  Eye, 
  Video, 
  Folder,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

export const VideoFileManager: React.FC = () => {
  const [videoFiles, setVideoFiles] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { listFiles, deleteFile, getFileUrl } = useFileStorage();
  const { tutorials } = useSupabaseTutorials();
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const videos = await listFiles('tutorial-videos');
      setVideoFiles(videos as VideoFile[]);
    } catch (error) {
      console.error('Error loading video files:', error);
      toast({
        title: "Error loading video files",
        description: "Failed to load video file list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    try {
      const success = await deleteFile('tutorial-videos', fileName);
      if (success) {
        await loadFiles(); // Refresh the file list
        toast({
          title: "Video deleted successfully",
          description: "The video file has been removed"
        });
      } else {
        throw new Error('Delete operation failed');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error deleting video",
        description: "Failed to delete the video file",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const findTutorialByVideoUrl = (fileName: string) => {
    const fileUrl = getFileUrl('tutorial-videos', fileName);
    return tutorials.find(tutorial => 
      tutorial.video_url === fileUrl || 
      tutorial.video_url.includes(fileName)
    );
  };

  const downloadFile = async (fileName: string) => {
    try {
      const url = getFileUrl('tutorial-videos', fileName);
      // For Supabase URLs, we need to trigger download differently
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Download started",
        description: `${fileName} is downloading`
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Could not download the file",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Video File Management</h2>
        <Button
          onClick={loadFiles}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Uploaded Videos
            </span>
            <Badge variant="outline">{videoFiles.length} files</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-12 w-12 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p>Loading video files...</p>
            </div>
          ) : videoFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No video files uploaded yet</p>
              <p className="text-sm mt-2">Upload videos through the tutorial creation process</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videoFiles.map((file) => {
                const tutorial = findTutorialByVideoUrl(file.name);
                return (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border border-muted rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <Video className="h-8 w-8 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.metadata?.size || 0)} • {new Date(file.updated_at).toLocaleDateString()}
                        </p>
                        {tutorial ? (
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-xs">
                              Used in: {tutorial.title}
                            </Badge>
                          </div>
                        ) : (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              Not linked to any tutorial
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const url = getFileUrl('tutorial-videos', file.name);
                          window.open(url, '_blank');
                        }}
                        title="Preview video"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadFile(file.name)}
                        title="Download video"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {tutorial && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Navigate to tutorial edit or view
                            window.open(`#tutorial-${tutorial.id}`, '_blank');
                          }}
                          title="View tutorial"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteFile(file.name)}
                        title="Delete video"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};