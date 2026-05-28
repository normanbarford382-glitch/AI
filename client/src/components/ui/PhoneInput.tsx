import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';

export interface Country {
  code: string;
  name: string;
  nameAr: string;
  dial: string;
  flag: string;
}

export const PHONE_COUNTRIES: Country[] = [
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
  { code: 'PS', name: 'Palestine', nameAr: 'فلسطين', dial: '+970', flag: '🇵🇸' },
  { code: 'TR', name: 'Turkey', nameAr: 'تركيا', dial: '+90', flag: '🇹🇷' },
  { code: 'DE', name: 'Germany', nameAr: 'ألمانيا', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', nameAr: 'فرنسا', dial: '+33', flag: '🇫🇷' },
  { code: 'GB', name: 'United Kingdom', nameAr: 'بريطانيا', dial: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', dial: '+1', flag: '🇺🇸' },
];

function parsePhone(value: string, defaultCountry: Country): { country: Country; national: string } {
  const trimmed = value.replace(/\s/g, '');
  if (!trimmed) return { country: defaultCountry, national: '' };
  const sorted = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (trimmed.startsWith(c.dial)) {
      return { country: c, national: trimmed.slice(c.dial.length) };
    }
  }
  if (trimmed.startsWith('+')) {
    return { country: defaultCountry, national: trimmed.replace(/^\+\d+/, '') };
  }
  return { country: defaultCountry, national: trimmed };
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  defaultCountryCode?: string;
}

export default function PhoneInput({ value, onChange, required, className = '', defaultCountryCode = 'SY' }: PhoneInputProps) {
  const { locale } = useLocale();
  const defaultCountry = PHONE_COUNTRIES.find(c => c.code === defaultCountryCode) || PHONE_COUNTRIES[0];
  const [country, setCountry] = useState<Country>(defaultCountry);
  const [national, setNational] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parsed = parsePhone(value, defaultCountry);
    setCountry(parsed.country);
    setNational(parsed.national);
  }, [value]);

  const emit = (c: Country, n: string) => {
    const digits = n.replace(/\D/g, '');
    onChange(digits ? `${c.dial}${digits}` : '');
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = PHONE_COUNTRIES.filter(c => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.nameAr.includes(search) || c.dial.includes(q) || c.code.toLowerCase().includes(q);
  });

  return (
    <div ref={containerRef} className={`relative flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-3 bg-muted border border-border border-e-0 rounded-s-xl text-sm hover:bg-muted/80 transition-colors shrink-0"
        aria-label={locale === 'ar' ? 'اختر الدولة' : 'Select country'}
      >
        <span className="text-lg leading-none">{country.flag}</span>
        <span className="font-medium text-foreground tabular-nums">{country.dial}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <input
        type="tel"
        inputMode="numeric"
        value={national}
        onChange={e => {
          const v = e.target.value.replace(/\D/g, '');
          setNational(v);
          emit(country, v);
        }}
        required={required}
        placeholder={locale === 'ar' ? '9XX XXX XXX' : '9XX XXX XXX'}
        className="flex-1 min-w-0 px-4 py-3 bg-muted border border-border rounded-e-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {open && (
        <div className="absolute top-full start-0 z-50 mt-1 w-72 max-h-64 overflow-hidden bg-card border border-border rounded-xl shadow-xl">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute top-2.5 start-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={locale === 'ar' ? 'بحث عن دولة...' : 'Search country...'}
                className="w-full ps-9 pe-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
          <ul className="overflow-y-auto max-h-48 py-1">
            {filtered.map(c => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => {
                    setCountry(c);
                    setOpen(false);
                    setSearch('');
                    emit(c, national);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-muted transition-colors ${c.code === country.code ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="flex-1 text-start truncate">{locale === 'ar' ? c.nameAr : c.name}</span>
                  <span className="text-muted-foreground tabular-nums font-medium">{c.dial}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
