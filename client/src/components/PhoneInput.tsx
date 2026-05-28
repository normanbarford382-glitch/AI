import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useLocale } from '../context/LocaleContext';

export interface Country {
  code: string;
  name: string;
  nameAr: string;
  dial: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { code: 'SY', name: 'Syria', nameAr: 'سوريا', dial: '+963', flag: '🇸🇾' },
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', dial: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'UAE', nameAr: 'الإمارات', dial: '+971', flag: '🇦🇪' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن', dial: '+962', flag: '🇯🇴' },
  { code: 'LB', name: 'Lebanon', nameAr: 'لبنان', dial: '+961', flag: '🇱🇧' },
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق', dial: '+964', flag: '🇮🇶' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر', dial: '+20', flag: '🇪🇬' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', dial: '+965', flag: '🇰🇼' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر', dial: '+974', flag: '🇶🇦' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', dial: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman', nameAr: 'عُمان', dial: '+968', flag: '🇴🇲' },
  { code: 'YE', name: 'Yemen', nameAr: 'اليمن', dial: '+967', flag: '🇾🇪' },
  { code: 'PS', name: 'Palestine', nameAr: 'فلسطين', dial: '+970', flag: '🇵🇸' },
  { code: 'TR', name: 'Turkey', nameAr: 'تركيا', dial: '+90', flag: '🇹🇷' },
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة', dial: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', nameAr: 'ألمانيا', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', nameAr: 'فرنسا', dial: '+33', flag: '🇫🇷' },
];

const DEFAULT_COUNTRY = COUNTRIES[0];

function findCountryByDial(value: string): Country | undefined {
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  return sorted.find(c => value.startsWith(c.dial));
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export default function PhoneInput({ value, onChange, required, className = '' }: PhoneInputProps) {
  const { locale } = useLocale();
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [national, setNational] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) return;
    const matched = findCountryByDial(value);
    if (matched) {
      setCountry(matched);
      setNational(value.slice(matched.dial.length).replace(/\D/g, ''));
    }
  }, []);

  useEffect(() => {
    const full = national ? `${country.dial}${national}` : '';
    if (full !== value) onChange(full);
  }, [country, national]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = COUNTRIES.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.nameAr.includes(search) || c.dial.includes(q) || c.code.toLowerCase().includes(q);
  });

  const selectCountry = (c: Country) => {
    setCountry(c);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-3 bg-muted border border-border rounded-s-xl border-e-0 hover:bg-muted/80 transition-colors shrink-0"
        aria-label={locale === 'ar' ? 'اختر الدولة' : 'Select country'}
      >
        <span className="text-lg leading-none">{country.flag}</span>
        <span className="text-sm font-semibold text-foreground tabular-nums">{country.dial}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <input
        type="tel"
        inputMode="numeric"
        value={national}
        onChange={e => setNational(e.target.value.replace(/\D/g, ''))}
        required={required}
        placeholder={locale === 'ar' ? '9XX XXX XXX' : '9XX XXX XXX'}
        className="flex-1 min-w-0 px-4 py-3 bg-muted border border-border rounded-e-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {open && (
        <div className="absolute top-full start-0 z-50 mt-1 w-72 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute top-2.5 start-3 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={locale === 'ar' ? 'بحث عن دولة...' : 'Search country...'}
                className="w-full ps-9 pe-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.map(c => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => selectCountry(c)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted transition-colors ${c.code === country.code ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 text-start font-medium">{locale === 'ar' ? c.nameAr : c.name}</span>
                  <span className="text-muted-foreground tabular-nums font-semibold">{c.dial}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-sm text-muted-foreground text-center">
                {locale === 'ar' ? 'لا توجد نتائج' : 'No results'}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
