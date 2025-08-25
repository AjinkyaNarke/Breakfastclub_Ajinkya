import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Plus, ExternalLink, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PressArticle {
  id: string;
  title: string;
  publication_name: string;
  article_url: string;
  publication_date: string;
  excerpt: string | null;
  image_url: string | null;
  is_featured: boolean;
  display_order: number;
  created_at: string;
}

interface ArticleFormData {
  title: string;
  publication_name: string;
  article_url: string;
  publication_date: string;
  excerpt: string;
  image_url: string;
  is_featured: boolean;
  display_order: number;
}

const initialFormData: ArticleFormData = {
  title: "",
  publication_name: "",
  article_url: "",
  publication_date: "",
  excerpt: "",
  image_url: "",
  is_featured: false,
  display_order: 0,
};

export const PressManagement = () => {
  const [articles, setArticles] = useState<PressArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ArticleFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null); // article id
  const { toast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('press_articles')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('publication_date', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch press articles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.publication_name || !formData.article_url || !formData.publication_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const articleData = {
        title: formData.title,
        publication_name: formData.publication_name,
        article_url: formData.article_url,
        publication_date: formData.publication_date,
        excerpt: formData.excerpt || null,
        image_url: formData.image_url || null,
        is_featured: formData.is_featured,
        display_order: formData.display_order,
      };

      if (editingId) {
        const { error } = await supabase
          .from('press_articles')
          .update(articleData)
          .eq('id', editingId);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Press article updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('press_articles')
          .insert([articleData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Press article created successfully",
        });
      }

      setFormData(initialFormData);
      setEditingId(null);
      setIsDialogOpen(false);
      fetchArticles();
    } catch (error) {
      console.error('Error saving article:', error);
      toast({
        title: "Error",
        description: "Failed to save press article",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (article: PressArticle) => {
    setFormData({
      title: article.title,
      publication_name: article.publication_name,
      article_url: article.article_url,
      publication_date: article.publication_date,
      excerpt: article.excerpt || "",
      image_url: article.image_url || "",
      is_featured: article.is_featured,
      display_order: article.display_order,
    });
    setEditingId(article.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(id);
    try {
      const { error } = await supabase
        .from('press_articles')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Press article deleted successfully",
      });
      fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      toast({
        title: "Error",
        description: "Failed to delete press article",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingId(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Press Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Press Management</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} aria-label="Add Press Article">
              <Plus className="w-4 h-4 mr-2" />
              Add Press Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Press Article' : 'Add New Press Article'}
              </DialogTitle>
              <DialogDescription>
                {editingId ? 'Update the press article details below.' : 'Create a new press article for your restaurant.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Article Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter article title"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="publication_name">Publication Name *</Label>
                  <Input
                    id="publication_name"
                    value={formData.publication_name}
                    onChange={(e) => setFormData({ ...formData, publication_name: e.target.value })}
                    placeholder="e.g., Food & Wine Magazine"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="article_url">Article URL *</Label>
                <Input
                  id="article_url"
                  type="url"
                  value={formData.article_url}
                  onChange={(e) => setFormData({ ...formData, article_url: e.target.value })}
                  placeholder="https://example.com/article"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="publication_date">Publication Date *</Label>
                  <Input
                    id="publication_date"
                    type="date"
                    value={formData.publication_date}
                    onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="display_order">Display Order</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image_url">Publication Logo/Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Article Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description or excerpt from the article..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Featured Article</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                  aria-label="Cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} aria-label={editingId ? 'Update Article' : 'Create Article'}>
                  {saving ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                  ) : editingId ? 'Update Article' : 'Create Article'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Card key={article.id} className="group">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2 mb-2">
                    {article.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{article.publication_name}</Badge>
                    {article.is_featured && (
                      <Badge variant="default">Featured</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center text-sm text-muted-foreground mb-3">
                <Calendar className="w-4 h-4 mr-1" />
                {format(new Date(article.publication_date), 'MMM d, yyyy')}
              </div>
              
              {article.excerpt && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
              )}
              
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(article.article_url, '_blank')}
                  aria-label="View Article"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </Button>
                
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(article)}
                    aria-label="Edit Article"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" aria-label="Delete Article" disabled={deleteLoading === article.id}>
                        {deleteLoading === article.id ? (
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Press Article</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{article.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(article.id)} aria-label="Confirm Delete" disabled={deleteLoading === article.id}>
                          {deleteLoading === article.id ? (
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-1" />
                          ) : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No press articles found. Add your first article to get started.</p>
        </div>
      )}
    </div>
  );
};