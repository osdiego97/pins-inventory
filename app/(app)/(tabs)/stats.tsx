import { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePins } from '../../../hooks/usePins';
import { useStats } from '../../../hooks/useStats';
import SummaryCards from '../../../components/stats/SummaryCards';
import DonutChart from '../../../components/stats/DonutChart';
import CategorySection from '../../../components/stats/CategorySection';
import CountryBars from '../../../components/stats/CountryBars';
import YearColumns from '../../../components/stats/YearColumns';
import YearLine from '../../../components/stats/YearLine';
import CitiesDepth from '../../../components/stats/CitiesDepth';
import Completeness from '../../../components/stats/Completeness';

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
  const [barsExpanded, setBarsExpanded] = useState(false);

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
      <View className="flex-1 bg-surface items-center justify-center px-8 gap-4">
        <Text className="text-text-secondary text-center">{error}</Text>
        <TouchableOpacity onPress={refetch} activeOpacity={0.7} className="px-5 py-2.5 rounded-xl bg-surface-elevated">
          <Text className="text-text-primary text-sm font-semibold">Reintentar</Text>
        </TouchableOpacity>
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
                <TouchableOpacity
                  onPress={() => setBarsExpanded((v) => !v)}
                  activeOpacity={0.7}
                  className="flex-row items-center justify-between px-4 pb-3"
                >
                  <Text className="text-text-muted text-xs uppercase tracking-widest">
                    Por categoría
                  </Text>
                  <Ionicons
                    name={barsExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#606060"
                  />
                </TouchableOpacity>
                {barsExpanded && (
                  <CategorySection
                    categories={stats.categories}
                    uncategorized={stats.uncategorized}
                  />
                )}
              </View>
            )}
          </Card>
        </View>

        {/* Countries */}
        {stats.countries.length > 0 && (
          <View className="mt-6">
            <SectionHeader title="Por País" />
            <Card>
              <CountryBars countries={stats.countries} />
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

        {/* Cumulative growth */}
        {stats.cumulative.length > 1 && (
          <View className="mt-6">
            <SectionHeader title="Evolución" />
            <Card>
              <YearLine data={stats.cumulative} />
            </Card>
          </View>
        )}

        {/* Geographic depth */}
        {stats.citiesPerCountry.length > 0 && (
          <View className="mt-6">
            <SectionHeader title="Ciudades por País" />
            <Card>
              <CitiesDepth data={stats.citiesPerCountry} />
            </Card>
          </View>
        )}

        {/* Completeness */}
        <View className="mt-6">
          <SectionHeader title="Completitud" />
          <Card>
            <Completeness data={stats.completeness} />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
