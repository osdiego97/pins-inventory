import { View, Text } from 'react-native';
import { CollectionStats } from '../../hooks/useStats';

interface Props {
  stats: CollectionStats;
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 bg-surface-card rounded-2xl p-4">
      <Text className="text-text-primary text-3xl font-bold" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text className="text-text-muted text-xs mt-1 uppercase tracking-widest">{label}</Text>
    </View>
  );
}

export default function SummaryCards({ stats }: Props) {
  const yearLabel = stats.yearRange
    ? `${stats.yearRange.min}–${stats.yearRange.max}`
    : '—';

  return (
    <View className="px-4 gap-3">
      <View className="flex-row gap-3">
        <StatCard value={String(stats.totalPins)} label="Pins" />
        <StatCard value={String(stats.totalCountries)} label="Países" />
      </View>
      <View className="flex-row gap-3">
        <StatCard value={String(stats.totalCities)} label="Ciudades" />
        <StatCard value={yearLabel} label="Años" />
      </View>
    </View>
  );
}
