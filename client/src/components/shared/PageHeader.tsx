import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8', className)}
    >
      <div>
        <h1 className="page-header">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}
