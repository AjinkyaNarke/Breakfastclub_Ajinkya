import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Video, Trash2, Edit, Play, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AboutVideo {
  id: string;
  section_id: string;
  video_url: string;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  display_order: number | null;
  thumbnail_url: string | null;
  video_type: string;
  external_video_id: string | null;
  duration: number | null;
  file_size: number | null;
}

interface AboutVideoManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  sectionTitle: string;
  onVideosUpdated: () => void;
}

export function AboutVideoManager({ 
  open, 
  onOpenChange, 
  sectionId, 
  sectionTitle,
  onVideosUpdated 
}: AboutVideoManagerProps) {
  const [videos, setVideos] = useState<AboutVideo[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingVideo, setEditingVideo] = useState<AboutVideo | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [editForm, setEditForm] = useState({
    title: '',
    caption: '',
    alt_text: ''
  });
  const [externalVideoForm, setExternalVideoForm] = useState({
    url: '',
    title: '',
    caption: '',
    alt_text: '',
    video_type: 'youtube'
  });
  const { toast } = useToast();

  // Fetch existing videos for this section
  useEffect(() => {
    if (open && sectionId) {
      fetchVideos();
    }
  }, [open, sectionId]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('about_videos')
        .select('*')
        .eq('section_id', sectionId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch videos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
    }
  };

  const extractVideoId = (url: string, type: string): string | null => {
    if (type === 'youtube') {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } else if (type === 'vimeo') {
      const regExp = /vimeo\.com\/(?:channels\/[A-z]+\/|groups\/[A-z]+\/videos\/|album\/\d+\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
      const match = url.match(regExp);
      return match ? match[1] : null;
    }
    return null;
  };

  const getEmbedUrl = (videoId: string, type: string): string => {
    if (type === 'youtube') {
      return `https://www.youtube.com/embed/${videoId}`;
    } else if (type === 'vimeo') {
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return '';
  };

  const uploadVideo = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `about/${sectionId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('restaurant-videos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('restaurant-videos')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('about_videos')
        .insert({
          section_id: sectionId,
          video_url: urlData.publicUrl,
          title: `Video ${videos.length + 1}`,
          alt_text: `About section video ${videos.length + 1}`,
          display_order: videos.length + 1,
          video_type: 'uploaded',
          file_size: selectedFile.size
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });

      // Clear selections and refresh
      setSelectedFile(null);
      setPreview(null);
      fetchVideos();
      onVideosUpdated();
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error",
        description: "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addExternalVideo = async () => {
    if (!externalVideoForm.url) return;

    const videoId = extractVideoId(externalVideoForm.url, externalVideoForm.video_type);
    if (!videoId) {
      toast({
        title: "Error",
        description: "Invalid video URL",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const embedUrl = getEmbedUrl(videoId, externalVideoForm.video_type);

      // Save to database
      const { error: dbError } = await supabase
        .from('about_videos')
        .insert({
          section_id: sectionId,
          video_url: embedUrl,
          title: externalVideoForm.title || `${externalVideoForm.video_type} Video`,
          caption: externalVideoForm.caption || null,
          alt_text: externalVideoForm.alt_text || `${externalVideoForm.video_type} video`,
          display_order: videos.length + 1,
          video_type: externalVideoForm.video_type,
          external_video_id: videoId
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "External video added successfully",
      });

      // Clear form and refresh
      setExternalVideoForm({
        url: '',
        title: '',
        caption: '',
        alt_text: '',
        video_type: 'youtube'
      });
      fetchVideos();
      onVideosUpdated();
    } catch (error) {
      console.error('Error adding external video:', error);
      toast({
        title: "Error",
        description: "Failed to add external video",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteVideo = async (videoId: string, videoUrl: string, videoType: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      // Delete from storage if it's an uploaded video
      if (videoType === 'uploaded') {
        const fileName = videoUrl.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('restaurant-videos')
            .remove([`about/${sectionId}/${fileName}`]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('about_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video deleted successfully",
      });

      fetchVideos();
      onVideosUpdated();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  const startEditVideo = (video: AboutVideo) => {
    setEditingVideo(video);
    setEditForm({
      title: video.title || '',
      caption: video.caption || '',
      alt_text: video.alt_text || ''
    });
  };

  const saveVideoEdit = async () => {
    if (!editingVideo) return;

    try {
      const { error } = await supabase
        .from('about_videos')
        .update({
          title: editForm.title || null,
          caption: editForm.caption || null,
          alt_text: editForm.alt_text
        })
        .eq('id', editingVideo.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video updated successfully",
      });

      setEditingVideo(null);
      fetchVideos();
      onVideosUpdated();
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "destructive",
      });
    }
  };

  const removePreview = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Videos - {sectionTitle}</DialogTitle>
          <DialogDescription>
            Upload videos or add external video links for this about section
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Video</TabsTrigger>
            <TabsTrigger value="external">External Video</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label htmlFor="video-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Click to upload a video
                    </span>
                  </Label>
                  <Input
                    id="video-upload"
                    type="file"
                    className="hidden"
                    accept="video/*"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>
            </div>

            {preview && (
              <div className="relative">
                <video
                  src={preview}
                  controls
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={removePreview}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {selectedFile && (
              <Button 
                onClick={uploadVideo} 
                disabled={uploading}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Upload Video'}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="external" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="video-type">Video Platform</Label>
                  <Select
                    value={externalVideoForm.video_type}
                    onValueChange={(value) => setExternalVideoForm({ ...externalVideoForm, video_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="vimeo">Vimeo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="video-url">Video URL</Label>
                  <Input
                    id="video-url"
                    value={externalVideoForm.url}
                    onChange={(e) => setExternalVideoForm({ ...externalVideoForm, url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="external-title">Title</Label>
                <Input
                  id="external-title"
                  value={externalVideoForm.title}
                  onChange={(e) => setExternalVideoForm({ ...externalVideoForm, title: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="external-caption">Caption</Label>
                <Textarea
                  id="external-caption"
                  value={externalVideoForm.caption}
                  onChange={(e) => setExternalVideoForm({ ...externalVideoForm, caption: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="external-alt">Alt Text</Label>
                <Input
                  id="external-alt"
                  value={externalVideoForm.alt_text}
                  onChange={(e) => setExternalVideoForm({ ...externalVideoForm, alt_text: e.target.value })}
                />
              </div>

              <Button 
                onClick={addExternalVideo} 
                disabled={uploading || !externalVideoForm.url}
                className="w-full"
              >
                {uploading ? 'Adding...' : 'Add External Video'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Existing Videos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Existing Videos ({videos.length})</h3>
          
          {loading ? (
            <div className="text-center py-8">Loading videos...</div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Video className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2">No videos uploaded yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((video) => (
                <Card key={video.id}>
                  <CardContent className="p-4">
                    {video.video_type === 'uploaded' ? (
                      <video
                        src={video.video_url}
                        controls
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="relative">
                        <iframe
                          src={video.video_url}
                          className="w-full h-32 rounded-lg mb-3"
                          title={video.title || 'Video'}
                          allowFullScreen
                        />
                        <div className="absolute top-2 right-2">
                          <ExternalLink className="h-4 w-4 text-white bg-black/50 rounded p-1" />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="font-medium text-sm">{video.title || 'Untitled'}</p>
                      {video.caption && (
                        <p className="text-sm text-gray-600">{video.caption}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditVideo(video)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteVideo(video.id, video.video_url, video.video_type)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Video Dialog */}
        {editingVideo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Edit Video</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-caption">Caption</Label>
                  <Textarea
                    id="edit-caption"
                    value={editForm.caption}
                    onChange={(e) => setEditForm({ ...editForm, caption: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-alt">Alt Text</Label>
                  <Input
                    id="edit-alt"
                    value={editForm.alt_text}
                    onChange={(e) => setEditForm({ ...editForm, alt_text: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveVideoEdit}>Save</Button>
                  <Button variant="outline" onClick={() => setEditingVideo(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}