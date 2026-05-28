import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6 card-premium max-w-md mx-auto',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary/70" />
      </div>
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mt-2">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </motion.div>
  );
}
