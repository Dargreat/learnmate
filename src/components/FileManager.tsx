import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/FileUpload';
import { useFileStorage } from '@/hooks/useFileStorage';
import { 
  Trash2, 
  Download, 
  Eye, 
  Video, 
  Image, 
  File as FileIcon, 
  Folder,
  Upload,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileItem {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

export const FileManager: React.FC = () => {
  const [videoFiles, setVideoFiles] = useState<FileItem[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<FileItem[]>([]);
  const [userFiles, setUserFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { listFiles, deleteFile, getFileUrl } = useFileStorage();
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const [videos, attachments, userUploads] = await Promise.all([
        listFiles('tutorial-videos'),
        listFiles('tutorial-attachments'),
        listFiles('user-uploads')
      ]);

      setVideoFiles(videos as FileItem[]);
      setAttachmentFiles(attachments as FileItem[]);
      setUserFiles(userUploads as FileItem[]);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Error loading files",
        description: "Failed to load file list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (bucket: string, fileName: string) => {
    const success = await deleteFile(bucket, fileName);
    if (success) {
      loadFiles(); // Refresh the file list
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType?: string) => {
    if (mimeType && mimeType.startsWith('video/')) {
      return <Video className="h-4 w-4 text-blue-500" />;
    }
    if (mimeType && mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4 text-green-500" />;
    }
    return <FileIcon className="h-4 w-4 text-gray-500" />;
  };

  const FileList: React.FC<{ 
    files: FileItem[], 
    bucket: string, 
    title: string 
  }> = ({ files, bucket, title }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Badge variant="outline">{files.length} files</Badge>
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No files uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border border-muted rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file.metadata.mimetype)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.metadata?.size || 0)} • {new Date(file.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const url = getFileUrl(bucket, file.name);
                      window.open(url, '_blank');
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const url = getFileUrl(bucket, file.name);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = file.name;
                      a.click();
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteFile(bucket, file.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">File Storage Management</h2>
        <Button
          onClick={loadFiles}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="videos">Tutorial Videos</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="user-files">User Files</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Upload Tutorial Video
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  bucket="tutorial-videos"
                  accept="video/*"
                  maxSize={200}
                  placeholder="Upload video files for tutorials"
                  onFileUploaded={() => {
                    loadFiles();
                    toast({
                      title: "Video uploaded successfully",
                      description: "The video is now available for tutorials"
                    });
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileIcon className="h-5 w-5" />
                  Upload Attachment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  bucket="tutorial-attachments"
                  accept="*"
                  maxSize={50}
                  placeholder="Upload documents, images, or other files"
                  onFileUploaded={() => {
                    loadFiles();
                    toast({
                      title: "Attachment uploaded successfully",
                      description: "The file is now available for tutorials"
                    });
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <FileList files={videoFiles} bucket="tutorial-videos" title="Tutorial Videos" />
        </TabsContent>

        <TabsContent value="attachments">
          <FileList files={attachmentFiles} bucket="tutorial-attachments" title="Tutorial Attachments" />
        </TabsContent>

        <TabsContent value="user-files">
          <FileList files={userFiles} bucket="user-uploads" title="User Uploaded Files" />
        </TabsContent>
      </Tabs>
    </div>
  );
};