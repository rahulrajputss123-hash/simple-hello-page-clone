import { Check, Globe, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { COUNTRIES, COUNTRY_NAME_BY_CODE, countryLabel } from "@/lib/geo/countries";

/**
 * Searchable multi-select for GEO targeting.
 *
 * The stored value stays an array of ISO 3166-1 alpha-2 codes, so nothing on the
 * server or in the feed query changes. An EMPTY array means "all countries" —
 * that is the existing contract in src/lib/offers/feed-cache.server.ts, where an
 * offer with no countries is shown everywhere.
 *
 * Rendered inline rather than in a Popover because the offer form lives inside a
 * scrollable DialogContent, where a portalled popover fights the dialog for
 * focus and scroll.
 */
export function CountryMultiSelect({
  value,
  onChange,
  "data-testid": testId,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  "data-testid"?: string;
}) {
  const [query, setQuery] = useState("");

  const normalized = useMemo(
    () => value.map((c) => c.trim().toUpperCase()).filter(Boolean),
    [value],
  );
  const selected = useMemo(() => new Set(normalized), [normalized]);
  const allCountries = normalized.length === 0;

  /**
   * Codes already saved that aren't in the ISO list — the field used to be a
   * free-text input, so rows can hold typos or retired codes. They're kept and
   * shown so switching to this picker can't silently drop saved targeting.
   */
  const unknown = useMemo(() => normalized.filter((c) => !COUNTRY_NAME_BY_CODE[c]), [normalized]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [query]);

  /** Emit in a stable order: ISO list order (by name), then any unknown codes. */
  const emit = (next: Set<string>) => {
    const known = COUNTRIES.filter((c) => next.has(c.code)).map((c) => c.code);
    const extras = [...next].filter((c) => !COUNTRY_NAME_BY_CODE[c]).sort();
    onChange([...known, ...extras]);
  };

  const toggle = (code: string) => {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    emit(next);
  };

  const remove = (code: string) => {
    const next = new Set(selected);
    next.delete(code);
    emit(next);
  };

  return (
    <div className="space-y-2" data-testid={testId}>
      {/* All Countries — clearing the array is what makes an offer global. */}
      <button
        type="button"
        onClick={() => onChange([])}
        aria-pressed={allCountries}
        data-testid="country-select-all"
        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
          allCountries
            ? "border-primary bg-mint/15 text-primary"
            : "border-border bg-card text-muted-foreground hover:border-primary/40"
        }`}
      >
        <Globe className="size-4 shrink-0" />
        <span className="flex-1">All Countries</span>
        {allCountries ? (
          <Check className="size-4 shrink-0" />
        ) : (
          <span className="text-[11px] font-normal">clears the list</span>
        )}
      </button>

      {allCountries ? (
        <p className="px-1 text-[11px] text-muted-foreground">
          No GEO restriction — this offer is shown in every country.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5" data-testid="country-select-chips">
          {normalized.map((code) => (
            <Badge
              key={code}
              variant="secondary"
              className="gap-1 py-1 pl-2 pr-1 text-[11px] font-semibold"
            >
              {COUNTRY_NAME_BY_CODE[code] ? code : `${code}?`}
              <button
                type="button"
                onClick={() => remove(code)}
                aria-label={`Remove ${countryLabel(code)}`}
                data-testid={`country-chip-remove-${code}`}
                className="grid size-4 place-items-center rounded-full hover:bg-destructive/15 hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {unknown.length > 0 && (
        <p className="px-1 text-[11px] text-amber-600" data-testid="country-select-unknown">
          Not valid ISO codes, kept as-is from the old text field:{" "}
          <span className="font-semibold">{unknown.join(", ")}</span>. Remove them unless a partner
          expects those values.
        </p>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search country or code…"
          aria-label="Search countries"
          className="pl-8"
          data-testid="country-select-search"
        />
      </div>

      <div
        className="max-h-56 overflow-y-auto rounded-xl border border-border bg-card"
        data-testid="country-select-list"
      >
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            No country matches “{query}”.
          </p>
        ) : (
          <ul>
            {filtered.map((country) => {
              const checked = selected.has(country.code);
              const id = `country-opt-${country.code}`;
              return (
                <li key={country.code}>
                  <label
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm hover:bg-background-alt"
                  >
                    <Checkbox
                      id={id}
                      checked={checked}
                      onCheckedChange={() => toggle(country.code)}
                      data-testid={`country-option-${country.code}`}
                    />
                    <span className="w-7 shrink-0 font-mono text-xs font-semibold text-primary">
                      {country.code}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{country.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-[11px] text-muted-foreground" data-testid="country-select-count">
          {allCountries ? "All countries" : `${normalized.length} selected`}
        </p>
        {!allCountries && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 text-[11px]"
            onClick={() => onChange([])}
            data-testid="country-select-clear"
          >
            Clear all
          </Button>
        )}
      </div>
    </div>
  );
}
