'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from '@/lib/countries';

interface PhoneInputProps {
  value: string; // full E.164 string e.g. "+905321234567"
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  testId?: string;
}

function buildE164(dialCode: string, local: string): string {
  const digits = local.replace(/\D/g, '');
  return digits ? `${dialCode}${digits}` : '';
}

export default function PhoneInput({
  value,
  onChange,
  disabled,
  placeholder = '5XX XXX XX XX',
  testId,
}: PhoneInputProps) {
  // Derive initial country from value prefix
  function countryFromValue(val: string): Country {
    if (!val) return DEFAULT_COUNTRY;
    const match = COUNTRIES.find((c) => val.startsWith(c.dialCode));
    return match ?? DEFAULT_COUNTRY;
  }

  const [country, setCountry] = useState<Country>(() => countryFromValue(value));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const localPart = value.startsWith(country.dialCode)
    ? value.slice(country.dialCode.length)
    : value.replace(/^\+\d{1,4}/, '');

  function handleCountrySelect(c: Country) {
    setCountry(c);
    setOpen(false);
    setSearch('');
    onChange(buildE164(c.dialCode, localPart));
  }

  function handleLocalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    onChange(buildE164(country.dialCode, digits));
  }

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search)
  );

  return (
    <div className="flex gap-2">
      {/* Country selector */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-50 min-w-[88px]"
          data-testid={testId ? `${testId}-country` : undefined}
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-muted-foreground">{country.dialCode}</span>
          <span className="text-muted-foreground text-xs">▾</span>
        </button>

        {open && (
          <div className="absolute left-0 top-10 z-50 w-64 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
            <div className="p-2 border-b border-border">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country…"
                className="w-full bg-background text-foreground text-sm px-2 py-1.5 rounded border border-border outline-none placeholder:text-muted-foreground"
              />
            </div>
            <ul className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted-foreground">No results</li>
              )}
              {filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors text-left"
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-muted-foreground shrink-0">{c.dialCode}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Local number */}
      <Input
        type="tel"
        inputMode="numeric"
        value={localPart}
        onChange={handleLocalChange}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1"
        data-testid={testId ? `${testId}-number` : undefined}
      />
    </div>
  );
}
