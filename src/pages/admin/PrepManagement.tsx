import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Calculator, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedPrepDialog } from '@/components/admin/EnhancedPrepDialog';
import { PrepCostBreakdown } from '@/components/admin/PrepCostBreakdown';
import { EnhancedPrep } from '@/types/preps';
import { useLocalization } from '@/hooks/useLocalization';

export const PrepManagement = () => {
  const { t } = useTranslation('admin');
  const { getLocalizedPrepText, currentLanguage } = useLocalization();
  const [preps, setPreps] = useState<EnhancedPrep[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrep, setEditingPrep] = useState<EnhancedPrep | null>(null);
  const [costBreakdownOpen, setCostBreakdownOpen] = useState(false);
  const [selectedPrepForBreakdown, setSelectedPrepForBreakdown] = useState<EnhancedPrep | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreps();
  }, []);

  // Re-fetch when language changes to get updated translations
  useEffect(() => {
    if (preps.length > 0) {
      fetchPreps();
    }
  }, [currentLanguage]);

  const fetchPreps = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('preps')
        .select(`
          *,
          prep_ingredients (
            id,
            quantity,
            unit,
            notes,
            ingredient:ingredients (
              id,
              name,
              name_de,
              name_en,
              unit,
              cost_per_unit
            )
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw error;
      }

      setPreps(data || []);
    } catch (error) {
      console.error('Error fetching preps:', error);
      toast({
        title: t('preps.fetchError', 'Error'),
        description: t('preps.fetchErrorDescription', 'Failed to fetch preps'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPrep(null);
    setDialogOpen(true);
  };

  const handleEdit = (prep: EnhancedPrep) => {
    setEditingPrep(prep);
    setDialogOpen(true);
  };

  const handleDelete = async (prep: EnhancedPrep) => {
    if (!confirm(t('preps.deleteConfirm', 'Are you sure you want to delete this prep?'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('preps')
        .delete()
        .eq('id', prep.id);

      if (error) {
        throw error;
      }

      setPreps(prevPreps => prevPreps.filter(p => p.id !== prep.id));

      toast({
        title: t('preps.deleteSuccess', 'Success'),
        description: t('preps.deleteSuccessDescription', 'Prep deleted successfully'),
      });
    } catch (error) {
      console.error('Error deleting prep:', error);
      toast({
        title: t('preps.deleteError', 'Error'),
        description: t('preps.deleteErrorDescription', 'Failed to delete prep'),
        variant: 'destructive',
      });
    }
  };

  const handleDialogSave = () => {
    fetchPreps();
    setDialogOpen(false);
  };

  const handleShowCostBreakdown = (prep: EnhancedPrep) => {
    setSelectedPrepForBreakdown(prep);
    setCostBreakdownOpen(true);
  };

  const filteredPreps = preps.filter(prep => {
    const searchLower = searchQuery.toLowerCase();
    return (
      prep.name.toLowerCase().includes(searchLower) ||
      prep.name_de?.toLowerCase().includes(searchLower) ||
      prep.name_en?.toLowerCase().includes(searchLower) ||
      prep.description.toLowerCase().includes(searchLower)
    );
  });

  const getDisplayName = (prep: EnhancedPrep) => {
    return getLocalizedPrepText(prep, 'name');
  };

  const getDisplayDescription = (prep: EnhancedPrep) => {
    return getLocalizedPrepText(prep, 'description');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('preps.title', 'Prep Management')}</h1>
          <p className="text-muted-foreground">
            {t('preps.description', 'Manage intermediate preps and their costs')}
          </p>
        </div>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {t('preps.addNew', 'Add New Prep')}
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('preps.searchPlaceholder', 'Search preps...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preps Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPreps.map((prep) => (
            <Card key={prep.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      {getDisplayName(prep)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {getDisplayDescription(prep)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShowCostBreakdown(prep)}
                        className="h-8 w-8 p-0"
                        title={t('preps.viewCostBreakdown', 'View Cost Breakdown')}
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(prep)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(prep)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t('preps.batchYield', 'Batch Yield')}:
                    </span>
                    <Badge variant="secondary">{prep.batch_yield}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t('preps.costPerBatch', 'Cost per Batch')}:
                    </span>
                    <div className="flex items-center gap-1">
                      <Calculator className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        €{prep.cost_per_batch?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>

                  {prep.notes && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">{t('preps.notes', 'Notes')}:</span> {prep.notes}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {t('preps.lastUpdated', 'Last updated')}: {new Date(prep.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && filteredPreps.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? t('preps.noResults', 'No preps found') : t('preps.noPreps', 'No preps yet')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? t('preps.noResultsDescription', 'Try adjusting your search terms')
                : t('preps.noPrepsDescription', 'Create your first prep to get started')
              }
            </p>
            {!searchQuery && (
              <Button onClick={handleAdd} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                {t('preps.addFirstPrep', 'Add First Prep')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Prep Dialog */}
      <EnhancedPrepDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSave}
      />

      {/* Cost Breakdown Modal */}
      {selectedPrepForBreakdown && (
        <div className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${costBreakdownOpen ? '' : 'hidden'}`}>
          <div className="bg-background rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {t('preps.costBreakdownTitle', 'Cost Breakdown')} - {getDisplayName(selectedPrepForBreakdown)}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCostBreakdownOpen(false)}
              >
                ✕
              </Button>
            </div>
            <PrepCostBreakdown prep={selectedPrepForBreakdown} showDetails={true} />
          </div>
        </div>
      )}
    </div>
  );
}; 