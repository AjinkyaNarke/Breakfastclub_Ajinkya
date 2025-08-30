import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeSelectorProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showCurrentTheme?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = 'outline',
  size = 'default',
  className,
  showCurrentTheme = true,
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Light theme for daytime use',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Dark theme for low-light environments',
    },
  ];

  const currentTheme = themes.find(t => t.value === theme);
  const CurrentIcon = currentTheme?.icon || Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            'transition-all duration-300 ease-in-out hover:scale-105',
            'group relative overflow-hidden',
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-4 w-4" />
            {showCurrentTheme && (
              <span className="text-sm font-medium">{currentTheme?.label}</span>
            )}
            {/* Theme indicator dot */}
            <div className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              resolvedTheme === 'dark' 
                ? 'bg-primary shadow-lg shadow-primary/50' 
                : 'bg-secondary shadow-lg shadow-secondary/50'
            )} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className="w-56 p-2 space-y-1"
      >
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.value;
          
          return (
            <DropdownMenuItem
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer',
                'transition-all duration-200 ease-in-out',
                'hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent text-accent-foreground',
                'group'
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <Icon className={cn(
                  'h-4 w-4 transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                  'group-hover:text-foreground'
                )} />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{themeOption.label}</span>
                    {isActive && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {themeOption.description}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Compact version for headers/navbars
export const CompactThemeSelector: React.FC<ThemeSelectorProps> = (props) => {
  return <ThemeSelector {...props} size="sm" variant="ghost" showCurrentTheme={false} />;
};

// Full version with descriptions
export const FullThemeSelector: React.FC<ThemeSelectorProps> = (props) => {
  return <ThemeSelector {...props} showCurrentTheme={true} />;
};
