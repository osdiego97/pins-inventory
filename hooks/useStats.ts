import { useMemo } from 'react';
import { Pin } from '../lib/types';

export interface L2Stat {
  name: string;
  count: number;
}

export interface L1Stat {
  name: string;
  count: number;
  l2: L2Stat[];
}

export interface CountryStat {
  country: string;
  count: number;
}

export interface YearStat {
  year: number;
  count: number;
}

export interface CollectionStats {
  totalPins: number;
  totalCountries: number;
  totalCities: number;
  yearRange: { min: number; max: number } | null;
  categories: L1Stat[];
  uncategorized: number;
  countries: CountryStat[];
  extraCountries: number;
  years: YearStat[];
  pinsWithoutYear: number;
}

export function useStats(pins: Pin[]): CollectionStats {
  return useMemo(() => {
    const totalPins = pins.length;
    const totalCountries = new Set(pins.map((p) => p.country).filter(Boolean)).size;
    const totalCities = new Set(pins.map((p) => p.city).filter(Boolean)).size;

    const acquiredYears = pins
      .map((p) => p.acquired_year)
      .filter((y): y is number => y != null);
    const yearRange =
      acquiredYears.length > 0
        ? { min: Math.min(...acquiredYears), max: Math.max(...acquiredYears) }
        : null;

    // --- Categories ---
    const l1Map = new Map<string, { count: number; id: string; l2: Map<string, number> }>();
    let uncategorized = 0;

    for (const pin of pins) {
      const pinTags = pin.tags ?? [];
      const l1Tags = pinTags.filter((t) => !t.parent_id);
      const l2Tags = pinTags.filter((t) => !!t.parent_id);

      if (l1Tags.length === 0) {
        uncategorized++;
        continue;
      }

      for (const l1 of l1Tags) {
        if (!l1Map.has(l1.name)) {
          l1Map.set(l1.name, { count: 0, id: l1.id, l2: new Map() });
        }
        const entry = l1Map.get(l1.name)!;
        entry.count++;
        for (const l2 of l2Tags.filter((t) => t.parent_id === l1.id)) {
          entry.l2.set(l2.name, (entry.l2.get(l2.name) ?? 0) + 1);
        }
      }
    }

    const categories: L1Stat[] = Array.from(l1Map.entries())
      .map(([name, { count, l2 }]) => ({
        name,
        count,
        l2: Array.from(l2.entries())
          .map(([l2name, l2count]) => ({ name: l2name, count: l2count }))
          .sort((a, b) => b.count - a.count),
      }))
      .sort((a, b) => b.count - a.count);

    // --- Countries ---
    const countryMap = new Map<string, number>();
    for (const pin of pins) {
      if (pin.country) countryMap.set(pin.country, (countryMap.get(pin.country) ?? 0) + 1);
    }
    const allCountries = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
    const countries = allCountries.slice(0, 10);
    const extraCountries = Math.max(0, allCountries.length - 10);

    // --- Years ---
    const yearMap = new Map<number, number>();
    let pinsWithoutYear = 0;
    for (const pin of pins) {
      if (pin.acquired_year) {
        yearMap.set(pin.acquired_year, (yearMap.get(pin.acquired_year) ?? 0) + 1);
      } else {
        pinsWithoutYear++;
      }
    }
    const years: YearStat[] = Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    return {
      totalPins,
      totalCountries,
      totalCities,
      yearRange,
      categories,
      uncategorized,
      countries,
      extraCountries,
      years,
      pinsWithoutYear,
    };
  }, [pins]);
}
