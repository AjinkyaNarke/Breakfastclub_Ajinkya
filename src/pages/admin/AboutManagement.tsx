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
import { Plus, Edit, Trash2, Image, ArrowUp, ArrowDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

  const resetForm = () => {
    setFormData({
      section_key: "",
      title: "",
      subtitle: "",
      content: "",
      section_type: "text",
      is_published: true,
    });
    setIsEditing(false);
    setSelectedSection(null);
  };

  const handleEdit = (section: AboutSection) => {
    setSelectedSection(section);
    setFormData({
      section_key: section.section_key,
      title: section.title,
      subtitle: section.subtitle || "",
      content: section.content || "",
      section_type: section.section_type,
      is_published: section.is_published,
    });
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && selectedSection) {
      updateSectionMutation.mutate({
        id: selectedSection.id,
        data: formData,
      });
    } else {
      createSectionMutation.mutate(formData);
    }
  };

  const moveSection = (section: AboutSection, direction: 'up' | 'down') => {
    if (!sections) return;
    
    const currentIndex = sections.findIndex(s => s.id === section.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    
    const targetSection = sections[targetIndex];
    
    updateOrderMutation.mutate({ id: section.id, newOrder: targetSection.display_order });
    updateOrderMutation.mutate({ id: targetSection.id, newOrder: section.display_order });
  };

  const getSectionImages = (sectionId: string) => {
    return images?.filter(img => img.section_id === sectionId) || [];
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">About Us Management</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? "Edit Section" : "Create New Section"}
              </DialogTitle>
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
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createSectionMutation.isPending || updateSectionMutation.isPending}>
                  {isEditing ? "Update" : "Create"} Section
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
                        onClick={() => moveSection(section, 'up')}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => moveSection(section, 'down')}
                        disabled={index === sections.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(section)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteSectionMutation.mutate(section.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
              <CardTitle>Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Visit the{" "}
                  <a href="/about" target="_blank" className="text-primary underline">
                    About Us page
                  </a>{" "}
                  to see the live preview
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AboutManagement;