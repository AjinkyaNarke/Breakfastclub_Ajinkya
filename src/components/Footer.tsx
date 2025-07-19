
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-center md:text-left text-sm text-muted-foreground">
            © 2025 fckingbreakfastclub - Asian Fusion • Berlin • Where traditional Asian breakfast culture meets Berlin's vibrant community spirit
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-4 text-sm">
            <Link 
              to="/impressum" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Impressum
            </Link>
            <Link 
              to="/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Datenschutz
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
