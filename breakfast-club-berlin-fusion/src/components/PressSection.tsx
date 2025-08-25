import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface PressArticle {
  id: string;
  title: string;
  publication_name: string;
  article_url: string;
  publication_date: string;
  excerpt: string | null;
  image_url: string | null;
  is_featured: boolean;
}

const PressSection = () => {
  const [articles, setArticles] = useState<PressArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPressArticles();
  }, []);

  const fetchPressArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('press_articles')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('publication_date', { ascending: false })
        .limit(4);

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching press articles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              As Seen In
            </h2>
            <div className="w-20 h-1 bg-primary mx-auto mb-6"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <Card className="h-full border-border/50 bg-card/50">
                  <CardContent className="p-6">
                    <div className="w-full h-32 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            As Seen In
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-6"></div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover what the media is saying about our authentic culinary experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {articles.map((article) => (
            <Card key={article.id} className="group h-full border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:border-primary/20">
              <CardContent className="p-6 h-full flex flex-col">
                {article.image_url && (
                  <div className="w-full h-32 mb-4 rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={article.image_url} 
                      alt={`${article.publication_name} logo`}
                      className="w-full h-full object-contain bg-background p-2"
                    />
                  </div>
                )}
                
                <div className="flex-1 flex flex-col">
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  
                  <div className="flex items-center text-sm text-muted-foreground mb-3">
                    <span className="font-medium text-primary">{article.publication_name}</span>
                    <Calendar className="w-3 h-3 mx-2" />
                    <span>{format(new Date(article.publication_date), 'MMM d, yyyy')}</span>
                  </div>
                  
                  {article.excerpt && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                      {article.excerpt}
                    </p>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
                    onClick={() => window.open(article.article_url, '_blank', 'noopener,noreferrer')}
                  >
                    Read Article
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {articles.length >= 4 && (
          <div className="text-center mt-12">
            <Button variant="secondary" size="lg" className="group">
              View All Press Coverage
              <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PressSection;