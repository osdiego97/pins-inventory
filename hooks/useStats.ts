import { useMemo } from 'react';
import { Item } from '../lib/types';

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

export interface CumulativeStat {
  year: number;
  total: number;
}

export interface CitiesPerCountryStat {
  country: string;
  cities: number;
}

export interface Completeness {
  withPhoto: number;
  withCategory: number;
  withYear: number;
}

export interface CollectionStats {
  totalPins: number;
  totalCountries: number;
  totalCities: number;
  yearRange: { min: number; max: number } | null;
  categories: L1Stat[];
  uncategorized: number;
  countries: CountryStat[];
  years: YearStat[];
  pinsWithoutYear: number;
  cumulative: CumulativeStat[];
  citiesPerCountry: CitiesPerCountryStat[];
  completeness: Completeness;
}

export function useStats(pins: Item[]): CollectionStats {
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
    const countries = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));

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

    // --- Cities per country ---
    const citiesMap = new Map<string, Set<string>>();
    for (const pin of pins) {
      if (pin.country && pin.city) {
        if (!citiesMap.has(pin.country)) citiesMap.set(pin.country, new Set());
        citiesMap.get(pin.country)!.add(pin.city);
      }
    }
    const citiesPerCountry: CitiesPerCountryStat[] = Array.from(citiesMap.entries())
      .map(([country, cities]) => ({ country, cities: cities.size }))
      .sort((a, b) => b.cities - a.cities || a.country.localeCompare(b.country));

    // --- Completeness ---
    const withPhoto = totalPins > 0 ? pins.filter((p) => !!p.image_url).length / totalPins : 0;
    const withCategory = totalPins > 0 ? (totalPins - uncategorized) / totalPins : 0;
    const withYear = totalPins > 0 ? pins.filter((p) => !!p.acquired_year).length / totalPins : 0;
    const completeness: Completeness = { withPhoto, withCategory, withYear };

    // --- Cumulative growth ---
    let running = 0;
    const cumulative: CumulativeStat[] = years.map((y) => {
      running += y.count;
      return { year: y.year, total: running };
    });

    return {
      totalPins,
      totalCountries,
      totalCities,
      yearRange,
      categories,
      uncategorized,
      countries,
      years,
      pinsWithoutYear,
      cumulative,
      citiesPerCountry,
      completeness,
    };
  }, [pins]);
}
