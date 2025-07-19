import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Save, X, Scale, FileText } from 'lucide-react';

interface ContentBlock {
  id: string;
  section_name: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  is_active: boolean;
  updated_at: string;
}

interface ContentForm {
  section_name: string;
  title: string;
  content: string;
  image_url: string;
  is_active: boolean;
}

export const ContentManagement = () => {
  const [editingBlock, setEditingBlock] = useState<ContentBlock | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<ContentForm>({
    section_name: '',
    title: '',
    content: '',
    image_url: '',
    is_active: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contentBlocks, isLoading } = useQuery({
    queryKey: ['admin-content-blocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('content_blocks')
        .select('*')
        .order('section_name');
      
      if (error) throw error;
      return data as ContentBlock[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (block: ContentBlock) => {
      const { error } = await supabase
        .from('content_blocks')
        .update({
          title: block.title,
          content: block.content,
          image_url: block.image_url,
          is_active: block.is_active
        })
        .eq('id', block.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-blocks'] });
      setEditingBlock(null);
      toast({
        title: "Success",
        description: "Content block updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update content block",
        variant: "destructive",
      });
      console.error('Update error:', error);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ContentForm) => {
      const { error } = await supabase
        .from('content_blocks')
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content-blocks'] });
      setIsCreating(false);
      setFormData({
        section_name: '',
        title: '',
        content: '',
        image_url: '',
        is_active: true
      });
      toast({
        title: "Success",
        description: "Content block created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create content block",
        variant: "destructive",
      });
      console.error('Create error:', error);
    },
  });

  const handleEdit = (block: ContentBlock) => {
    setEditingBlock({ ...block });
  };

  const handleSave = () => {
    if (editingBlock) {
      updateMutation.mutate(editingBlock);
    }
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const predefinedSections = [
    'hero', 'about', 'values', 'team', 'mission', 'story',
    'impressum', 'business_info', 'privacy_policy', 'cookie_policy', 'contact_details'
  ];

  const legalSections = ['impressum', 'business_info', 'privacy_policy', 'cookie_policy', 'contact_details'];

  const getLegalTemplate = (sectionName: string) => {
    const templates = {
      impressum: {
        title: "Angaben gemäß § 5 TMG",
        content: `[Firmenname]
[Name des Inhabers/Geschäftsführers]
[Straße und Hausnummer]
[PLZ und Ort]

Kontakt:
Telefon: [Telefonnummer]
E-Mail: [E-Mail-Adresse]

Umsatzsteuer-ID: [USt-IdNr.]
Steuer-Nr.: [Steuernummer]

Registereintrag: [falls vorhanden]
Registergericht: [falls vorhanden]
Registernummer: [falls vorhanden]`
      },
      business_info: {
        title: "Geschäftsinformationen",
        content: `Inhaber: [Name]
Geschäftszeiten: [Öffnungszeiten]
Adresse: [Vollständige Adresse]
Telefon: [Telefonnummer]
E-Mail: [E-Mail]`
      },
      privacy_policy: {
        title: "Datenschutzerklärung",
        content: `1. Datenschutz auf einen Blick

Diese Datenschutzerklärung klärt Sie über die Art, den Umfang und Zweck der Verarbeitung von personenbezogenen Daten auf.

2. Allgemeine Hinweise und Pflichtinformationen

Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst...

3. Datenerfassung auf unserer Website

Diese Website erhebt keine personenbezogenen Daten außer den technisch notwendigen Server-Logs...

4. Ihre Rechte

Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer personenbezogenen Daten...`
      },
      cookie_policy: {
        title: "Cookie-Richtlinie",
        content: `Diese Website verwendet nur technisch notwendige Cookies für:
- Session-Management
- Grundfunktionalität der Website

Wir verwenden keine Tracking- oder Marketing-Cookies.
Ihre Zustimmung ist nicht erforderlich für diese technisch notwendigen Cookies.`
      },
      contact_details: {
        title: "Kontaktinformationen",
        content: `Restaurant: [Name]
Adresse: [Straße, PLZ Ort]
Telefon: [Nummer]
E-Mail: [E-Mail]
Öffnungszeiten: [Zeiten]`
      }
    };
    return templates[sectionName] || { title: '', content: '' };
  };

  const handleCreateWithTemplate = (sectionName: string) => {
    const template = getLegalTemplate(sectionName);
    setFormData({
      section_name: sectionName,
      title: template.title,
      content: template.content,
      image_url: '',
      is_active: true
    });
    setIsCreating(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground">Manage your website content blocks</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Content Block
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Content</TabsTrigger>
          <TabsTrigger value="legal" className="gap-2">
            <Scale className="h-4 w-4" />
            Legal
          </TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="inactive">Inactive</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {contentBlocks?.map((block) => (
            <ContentBlockCard
              key={block.id}
              block={block}
              isEditing={editingBlock?.id === block.id}
              editingBlock={editingBlock}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={() => setEditingBlock(null)}
              onUpdate={setEditingBlock}
            />
          ))}
        </TabsContent>

        <TabsContent value="legal" className="space-y-4">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <FileText className="h-5 w-5" />
                German Legal Compliance
              </CardTitle>
              <CardDescription>
                Create and manage your Impressum, Privacy Policy, and other legally required content for German websites.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {legalSections.map((section) => {
                  const existing = contentBlocks?.find(block => block.section_name === section);
                  const sectionNames = {
                    impressum: 'Impressum',
                    business_info: 'Business Information',
                    privacy_policy: 'Privacy Policy',
                    cookie_policy: 'Cookie Policy',
                    contact_details: 'Contact Details'
                  };
                  
                  return (
                    <div key={section} className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">{sectionNames[section]}</h4>
                      {existing ? (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Status: {existing.is_active ? '✅ Active' : '❌ Inactive'}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(existing)}
                          >
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Not created yet</p>
                          <Button 
                            size="sm" 
                            onClick={() => handleCreateWithTemplate(section)}
                          >
                            Create with Template
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {contentBlocks?.filter(block => legalSections.includes(block.section_name)).map((block) => (
            <ContentBlockCard
              key={block.id}
              block={block}
              isEditing={editingBlock?.id === block.id}
              editingBlock={editingBlock}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={() => setEditingBlock(null)}
              onUpdate={setEditingBlock}
            />
          ))}
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          {contentBlocks?.filter(block => block.is_active).map((block) => (
            <ContentBlockCard
              key={block.id}
              block={block}
              isEditing={editingBlock?.id === block.id}
              editingBlock={editingBlock}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={() => setEditingBlock(null)}
              onUpdate={setEditingBlock}
            />
          ))}
        </TabsContent>
        
        <TabsContent value="inactive" className="space-y-4">
          {contentBlocks?.filter(block => !block.is_active).map((block) => (
            <ContentBlockCard
              key={block.id}
              block={block}
              isEditing={editingBlock?.id === block.id}
              editingBlock={editingBlock}
              onEdit={handleEdit}
              onSave={handleSave}
              onCancel={() => setEditingBlock(null)}
              onUpdate={setEditingBlock}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Create New Content Block Dialog */}
      {isCreating && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Create New Content Block</CardTitle>
            <CardDescription>Add a new content section to your website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="section_name">Section Name</Label>
                <select
                  id="section_name"
                  className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md"
                  value={formData.section_name}
                  onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                >
                  <option value="">Select or enter custom</option>
                  {predefinedSections.map((section) => (
                    <option key={section} value={section}>
                      {section.charAt(0).toUpperCase() + section.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Or enter custom section name"
                  value={formData.section_name}
                  onChange={(e) => setFormData({ ...formData, section_name: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                placeholder="Enter your content here. For legal sections, use the templates provided."
              />
            </div>
            
            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Create
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface ContentBlockCardProps {
  block: ContentBlock;
  isEditing: boolean;
  editingBlock: ContentBlock | null;
  onEdit: (block: ContentBlock) => void;
  onSave: () => void;
  onCancel: () => void;
  onUpdate: (block: ContentBlock) => void;
}

function ContentBlockCard({ 
  block, 
  isEditing, 
  editingBlock, 
  onEdit, 
  onSave, 
  onCancel, 
  onUpdate 
}: ContentBlockCardProps) {
  return (
    <Card className={isEditing ? "border-2 border-primary" : ""}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {block.section_name.charAt(0).toUpperCase() + block.section_name.slice(1)}
              {!block.is_active && (
                <span className="text-xs bg-muted px-2 py-1 rounded">Inactive</span>
              )}
            </CardTitle>
            <CardDescription>
              Last updated: {new Date(block.updated_at).toLocaleDateString()}
            </CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => onEdit(block)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing && editingBlock ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editingBlock.title || ''}
                onChange={(e) => onUpdate({ ...editingBlock, title: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editingBlock.content || ''}
                onChange={(e) => onUpdate({ ...editingBlock, content: e.target.value })}
                rows={4}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                type="url"
                value={editingBlock.image_url || ''}
                onChange={(e) => onUpdate({ ...editingBlock, image_url: e.target.value })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={editingBlock.is_active}
                onCheckedChange={(checked) => onUpdate({ ...editingBlock, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={onSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {block.title && (
              <div>
                <h4 className="font-semibold">Title</h4>
                <p className="text-muted-foreground">{block.title}</p>
              </div>
            )}
            
            {block.content && (
              <div>
                <h4 className="font-semibold">Content</h4>
                <p className="text-muted-foreground line-clamp-3">{block.content}</p>
              </div>
            )}
            
            {block.image_url && (
              <div>
                <h4 className="font-semibold">Image</h4>
                <img
                  src={block.image_url}
                  alt={block.title || 'Content image'}
                  className="max-w-xs h-24 object-cover rounded"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
