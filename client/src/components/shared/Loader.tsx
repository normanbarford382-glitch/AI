'use client';

import { motion } from 'framer-motion';
import { Laptop } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export default function Loader() {
  const { siteName, siteLogo } = useSiteSettings();

  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-flex w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-400 rounded-3xl items-center justify-center shadow-2xl overflow-hidden"
        >
          {siteLogo ? (
            <img src={siteLogo} alt={siteName || 'logo'} className="w-full h-full object-contain" />
          ) : (
            <Laptop className="w-10 h-10 text-white" />
          )}
        </motion.div>
        <div className="space-y-2">
          {siteName ? <h2 className="text-2xl font-black text-gradient">{siteName}</h2> : null}
          <div className="flex items-center justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 bg-primary rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
            className="w-3 h-3 bg-primary rounded-full"
          />
        ))}
      </div>
    </div>
  );
}
