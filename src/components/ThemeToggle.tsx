import React from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showLabels?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  variant = 'ghost',
  size = 'default',
  className,
  showLabels = false,
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'Light';
    }
  };

  const getNextTheme = () => {
    switch (theme) {
      case 'light':
        return 'dark';
      case 'dark':
        return 'light';
      default:
        return 'light';
    }
  };

  const handleThemeChange = () => {
    setTheme(getNextTheme());
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={variant}
        size={size}
        onClick={handleThemeChange}
        className={cn(
          'transition-all duration-300 ease-in-out hover:scale-105',
          'group relative overflow-hidden',
          className
        )}
        title={`Current: ${getThemeLabel()}. Click to switch to ${getNextTheme()}`}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            {getThemeIcon()}
            {/* Animated ring effect */}
            <div className={cn(
              'absolute inset-0 rounded-full transition-all duration-300',
              'group-hover:ring-2 group-hover:ring-primary/20',
              resolvedTheme === 'dark' ? 'ring-primary/30' : 'ring-secondary/30'
            )} />
          </div>
          {showLabels && (
            <span className="text-sm font-medium">{getThemeLabel()}</span>
          )}
        </div>
      </Button>
      
      {/* Theme indicator dot */}
      <div className="flex items-center gap-1">
        <div className={cn(
          'w-2 h-2 rounded-full transition-all duration-300',
          resolvedTheme === 'dark' 
            ? 'bg-primary shadow-lg shadow-primary/50' 
            : 'bg-secondary shadow-lg shadow-secondary/50'
        )} />
        {showLabels && (
          <span className="text-xs text-muted-foreground">
            {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
          </span>
        )}
      </div>
    </div>
  );
};

// Compact version for headers/navbars
export const CompactThemeToggle: React.FC<ThemeToggleProps> = (props) => {
  return <ThemeToggle {...props} size="sm" variant="ghost" />;
};

// Full version with labels
export const FullThemeToggle: React.FC<ThemeToggleProps> = (props) => {
  return <ThemeToggle {...props} showLabels={true} />;
};
