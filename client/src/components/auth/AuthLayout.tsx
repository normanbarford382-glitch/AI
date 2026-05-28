import { type ReactNode } from 'react';
import { Link } from 'wouter';
import { Laptop } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocale } from '../../context/LocaleContext';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { locale } = useLocale();

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 premium-gradient opacity-[0.07]" aria-hidden />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative w-full max-w-md glass-card rounded-3xl shadow-2xl shadow-primary/10 border border-border/80 p-8 space-y-6"
      >
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-14 h-14 premium-gradient rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 transition-transform"
          >
            <Laptop className="w-7 h-7 text-white" />
          </Link>
          <p className="text-xs text-muted-foreground tracking-wide uppercase">
            {locale === 'ar' ? 'متجر اللابتوبات الفاخر' : 'Premium Laptop Store'}
          </p>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
