import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Image, ArrowUp, ArrowDown, Video } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AboutImageManager } from "@/components/admin/AboutImageManager";
import { AboutVideoManager } from "@/components/admin/AboutVideoManager";

interface AboutSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  section_type: string;
  display_order: number;
  is_published: boolean;
}

interface AboutImage {
  id: string;
  section_id: string;
  image_url: string;
  title: string | null;
  caption: string | null;
  alt_text: string | null;
  display_order: number;
}

const AboutManagement = () => {
  const [selectedSection, setSelectedSection] = useState<AboutSection | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    section_key: "",
    title: "",
    subtitle: "",
    content: "",
    section_type: "text",
    is_published: true,
  });
  const [actionLoading, setActionLoading] = useState<{ [id: string]: string | null }>({}); // { [sectionId]: 'delete' | 'moveUp' | 'moveDown' | null }
  const [imageManagerOpen, setImageManagerOpen] = useState(false);
  const [selectedSectionForImages, setSelectedSectionForImages] = useState<AboutSection | null>(null);
  const [videoManagerOpen, setVideoManagerOpen] = useState(false);
  const [selectedSectionForVideos, setSelectedSectionForVideos] = useState<AboutSection | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ["about-sections-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_sections")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data as AboutSection[];
    },
  });

  const { data: images } = useQuery({
    queryKey: ["about-images-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_images")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data as AboutImage[];
    },
  });

  const { data: videos } = useQuery({
    queryKey: ["about-videos-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_videos")
        .select("*")
        .order("display_order");
      
      if (error) throw error;
      return data;
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const maxOrder = Math.max(0, ...(sections?.map(s => s.display_order) || []));
      const { error } = await supabase
        .from("about_sections")
        .insert({
          ...data,
          display_order: maxOrder + 1,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-sections-admin"] });
      toast.success("Section created successfully");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to create section: " + error.message);
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AboutSection> }) => {
      const { error } = await supabase
        .from("about_sections")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-sections-admin"] });
      toast.success("Section updated successfully");
      setIsEditing(false);
      setSelectedSection(null);
    },
    onError: (error) => {
      toast.error("Failed to update section: " + error.message);
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("about_sections")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-sections-admin"] });
      toast.success("Section deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete section: " + error.message);
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase
        .from("about_sections")
        .update({ display_order: newOrder })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-sections-admin"] });
    },
  });


  const moveSection = (section: AboutSection, direction: 'up' | 'down') => {
    if (!sections) return;
    
    const currentIndex = sections.findIndex(s => s.id === section.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    
    const targetSection = sections[targetIndex];
    
    updateOrderMutation.mutate({ id: section.id, newOrder: targetSection.display_order });
    updateOrderMutation.mutate({ id: targetSection.id, newOrder: section.display_order });
  };

  const handleDeleteSection = (id: string) => {
    setActionLoading(prev => ({ ...prev, [id]: 'delete' }));
    deleteSectionMutation.mutate(id, {
      onSettled: () => setActionLoading(prev => ({ ...prev, [id]: null }))
    });
  };

  const handleMoveSection = (section: AboutSection, direction: 'up' | 'down') => {
    setActionLoading(prev => ({ ...prev, [section.id]: direction === 'up' ? 'moveUp' : 'moveDown' }));
    moveSection(section, direction);
    setTimeout(() => setActionLoading(prev => ({ ...prev, [section.id]: null })), 1000); // optimistic, since moveSection is not async
  };

  const getSectionImages = (sectionId: string) => {
    return images?.filter(img => img.section_id === sectionId) || [];
  };

  const handleManageImages = (section: AboutSection) => {
    setSelectedSectionForImages(section);
    setImageManagerOpen(true);
  };

  const handleImagesUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["about-images-admin"] });
  };

  const handleManageVideos = (section: AboutSection) => {
    setSelectedSectionForVideos(section);
    setVideoManagerOpen(true);
  };

  const handleVideosUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ["about-videos-admin"] });
  };

  const getSectionVideos = (sectionId: string) => {
    return videos?.filter(video => video.section_id === sectionId) || [];
  };

  const resetForm = () => {
    setFormData({
      section_key: "",
      title: "",
      subtitle: "",
      content: "",
      section_type: "text",
      is_published: true,
    });
    setSelectedSection(null);
    setIsEditing(false);
  };

  const openAddDialog = () => {
    resetForm();
    setEditDialogOpen(true);
  };

  const handleEdit = (section: AboutSection) => {
    setFormData({
      section_key: section.section_key,
      title: section.title,
      subtitle: section.subtitle || "",
      content: section.content || "",
      section_type: section.section_type,
      is_published: section.is_published,
    });
    setSelectedSection(section);
    setIsEditing(true);
    setEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && selectedSection) {
      updateSectionMutation.mutate({
        id: selectedSection.id,
        ...formData,
      }, {
        onSuccess: () => {
          setEditDialogOpen(false);
          resetForm();
        }
      });
    } else {
      const maxOrder = Math.max(...(sections?.map(s => s.display_order) || [0]));
      createSectionMutation.mutate({
        ...formData,
        display_order: maxOrder + 1,
      }, {
        onSuccess: () => {
          setEditDialogOpen(false);
          resetForm();
        }
      });
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">About Us Management</h1>
        <Button onClick={openAddDialog} aria-label="Add Section">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>
        
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Section" : "Create New Section"}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? "Update the about section details." : "Add a new section to your about page."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="section_key">Section Key</Label>
                  <Input
                    id="section_key"
                    value={formData.section_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, section_key: e.target.value }))}
                    placeholder="unique-section-key"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="section_type">Section Type</Label>
                  <Select
                    value={formData.section_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, section_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="hero">Hero</SelectItem>
                      <SelectItem value="gallery">Gallery</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="timeline">Timeline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} aria-label="Cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={createSectionMutation.isPending || updateSectionMutation.isPending} aria-label={isEditing ? 'Update Section' : 'Create Section'}>
                  {(createSectionMutation.isPending || updateSectionMutation.isPending) ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  ) : isEditing ? "Update" : "Create"} Section
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="sections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <div className="grid gap-4">
            {sections?.map((section, index) => (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <Badge variant={section.section_type === 'hero' ? 'default' : 'secondary'}>
                        {section.section_type}
                      </Badge>
                      <Badge variant={section.is_published ? 'default' : 'destructive'}>
                        {section.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveSection(section, 'up')}
                        disabled={index === 0 || actionLoading[section.id] === 'moveUp'}
                        aria-label="Move Section Up"
                      >
                        {actionLoading[section.id] === 'moveUp' ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-1" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMoveSection(section, 'down')}
                        disabled={index === sections.length - 1 || actionLoading[section.id] === 'moveDown'}
                        aria-label="Move Section Down"
                      >
                        {actionLoading[section.id] === 'moveDown' ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageImages(section)}
                        aria-label="Manage Images"
                        title={`Manage images (${getSectionImages(section.id).length})`}
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManageVideos(section)}
                        aria-label="Manage Videos"
                        title={`Manage videos (${getSectionVideos(section.id).length})`}
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(section)}
                        aria-label="Edit Section"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteSection(section.id)}
                        aria-label="Delete Section"
                        disabled={actionLoading[section.id] === 'delete'}
                      >
                        {actionLoading[section.id] === 'delete' ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.subtitle && (
                      <p className="text-muted-foreground">{section.subtitle}</p>
                    )}
                    {section.content && (
                      <p className="text-sm line-clamp-3">{section.content}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Image className="h-4 w-4" />
                        <span>{getSectionImages(section.id).length} images</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Order: {section.display_order}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Live Preview</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('/about', '_blank')}
                  aria-label="Open in new tab"
                >
                  Open in New Tab
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden">
                <iframe
                  src="/about"
                  className="w-full h-[800px] border-0"
                  title="About Us Page Preview"
                  sandbox="allow-same-origin allow-scripts allow-forms"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Manager Dialog */}
      {selectedSectionForImages && (
        <AboutImageManager
          open={imageManagerOpen}
          onOpenChange={setImageManagerOpen}
          sectionId={selectedSectionForImages.id}
          sectionTitle={selectedSectionForImages.title}
          onImagesUpdated={handleImagesUpdated}
        />
      )}

      {/* Video Manager Dialog */}
      {selectedSectionForVideos && (
        <AboutVideoManager
          open={videoManagerOpen}
          onOpenChange={setVideoManagerOpen}
          sectionId={selectedSectionForVideos.id}
          sectionTitle={selectedSectionForVideos.title}
          onVideosUpdated={handleVideosUpdated}
        />
      )}
    </div>
  );
};

export default AboutManagement;