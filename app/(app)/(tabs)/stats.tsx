import { useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePins } from '../../../hooks/usePins';
import { useStats } from '../../../hooks/useStats';
import SummaryCards from '../../../components/stats/SummaryCards';
import DonutChart from '../../../components/stats/DonutChart';
import CategorySection from '../../../components/stats/CategorySection';
import CountryBars from '../../../components/stats/CountryBars';
import YearColumns from '../../../components/stats/YearColumns';

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="text-text-primary text-base font-semibold px-4 mb-3 mt-1">{title}</Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="mx-4 bg-surface-card rounded-2xl py-4 overflow-hidden">{children}</View>
  );
}

export default function StatsScreen() {
  const { pins, loading, error, refetch } = usePins();
  const stats = useStats(pins);
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  if (loading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator color="#e8c97e" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <Text className="text-text-secondary text-center">{error}</Text>
      </View>
    );
  }

  if (pins.length === 0) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <Text className="text-text-secondary text-center">
          Añade tu primer pin para ver estadísticas.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Header */}
        <View className="px-4 pt-4 pb-5">
          <Text className="text-text-primary text-2xl font-bold">Estadísticas</Text>
          <Text className="text-text-muted text-sm mt-0.5">Colección completa</Text>
        </View>

        {/* Summary */}
        <SummaryCards stats={stats} />

        {/* Categories */}
        <View className="mt-6">
          <SectionHeader title="Categorías" />
          <Card>
            <DonutChart
              categories={stats.categories}
              uncategorized={stats.uncategorized}
              totalPins={stats.totalPins}
            />
            {stats.categories.length > 0 && (
              <View className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: '#2a2a2a' }}>
                <CategorySection
                  categories={stats.categories}
                  uncategorized={stats.uncategorized}
                />
              </View>
            )}
          </Card>
        </View>

        {/* Countries */}
        {stats.countries.length > 0 && (
          <View className="mt-6">
            <SectionHeader title="Por País" />
            <Card>
              <CountryBars
                countries={stats.countries}
                extraCountries={stats.extraCountries}
              />
            </Card>
          </View>
        )}

        {/* Years */}
        {stats.years.length > 0 && (
          <View className="mt-6">
            <SectionHeader title="Por Año" />
            <Card>
              <YearColumns years={stats.years} pinsWithoutYear={stats.pinsWithoutYear} />
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
