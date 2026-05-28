import { type ReactNode } from 'react';
import Navbar from '../layout/Navbar';
import Footer from '../layout/Footer';
import { cn } from '../../lib/utils';

interface StorePageShellProps {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
}

/** Standard store page wrapper with navbar offset and footer */
export default function StorePageShell({ children, className, mainClassName }: StorePageShellProps) {
  return (
    <div className={cn('min-h-screen flex flex-col', className)}>
      <Navbar />
      <main className={cn('flex-1 container mx-auto px-4 pt-24 pb-12 animate-fade-in', mainClassName)}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
