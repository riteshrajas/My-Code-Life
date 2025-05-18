// filepath: p:/PERSONAL/Stage/stage/src/components/Layouts/NavItem.tsx
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider // Added TooltipProvider
} from '@/components/ui/tooltip';
import clsx from 'clsx';
import { Link, useLocation } from 'react-router-dom'; // Changed from next/link and next/navigation

export function NavItem({
  to, // Changed from href
  label,
  children
}: {
  to: string; // Changed from href
  label: string;
  children: React.ReactNode;
}) {
  const location = useLocation(); // Changed from usePathname

  return (
    <TooltipProvider> {/* Added TooltipProvider wrapper */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={to} // Changed from href
            className={clsx(
              'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
              {
                'bg-accent text-accent-foreground': location.pathname === to // Changed from pathname to location.pathname and href to to
              }
            )}
          >
            {children}
            <span className="sr-only">{label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
