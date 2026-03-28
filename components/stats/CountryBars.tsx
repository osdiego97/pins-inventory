import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { CountryStat } from '../../hooks/useStats';

const ANIMATION_DURATION = 800;
const STAGGER_MS = 50;
const BAR_COLOR = '#e8c97e';
const DEFAULT_LIMIT = 10;

interface BarRowProps {
  country: string;
  count: number;
  ratio: number;
  rank: number;
  containerWidth: number;
}

function BarRow({ country, count, ratio, rank, containerWidth }: BarRowProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const delay = rank * STAGGER_MS;
    const timer = setTimeout(() => {
      progress.value = withTiming(1, {
        duration: ANIMATION_DURATION,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    width: containerWidth * ratio * progress.value,
  }));

  return (
    <View className="flex-row items-center gap-3 py-1.5">
      <Text className="text-text-secondary text-sm w-28" numberOfLines={1}>
        {country}
      </Text>
      <View className="flex-1 h-1.5 rounded-full overflow-hidden bg-surface">
        <Animated.View
          style={[
            animatedStyle,
            { height: '100%', borderRadius: 4, backgroundColor: BAR_COLOR },
          ]}
        />
      </View>
      <Text className="text-text-primary text-sm font-semibold w-8 text-right">{count}</Text>
    </View>
  );
}

interface Props {
  countries: CountryStat[];
}

export default function CountryBars({ countries }: Props) {
  const [showAll, setShowAll] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const maxCount = countries.length > 0 ? countries[0].count : 1;
  const visible = showAll ? countries : countries.slice(0, DEFAULT_LIMIT);
  const hasMore = countries.length > DEFAULT_LIMIT;

  return (
    <View
      className="px-4"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - 32 - 36 - 32)}
    >
      {visible.map((c, i) => (
        <BarRow
          key={c.country}
          country={c.country}
          count={c.count}
          ratio={c.count / maxCount}
          rank={i}
          containerWidth={containerWidth}
        />
      ))}
      {hasMore && (
        <TouchableOpacity onPress={() => setShowAll((v) => !v)} activeOpacity={0.7} className="mt-2">
          <Text className="text-accent text-xs">
            {showAll
              ? 'Ver menos'
              : `Ver ${countries.length - DEFAULT_LIMIT} países más`}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
