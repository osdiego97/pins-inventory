import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
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
  extraCountries: number;
}

export default function CountryBars({ countries, extraCountries }: Props) {
  const [containerWidth, setContainerWidth] = useState(0);
  const maxCount = countries.length > 0 ? countries[0].count : 1;

  return (
    <View
      className="px-4"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - 32 - 36 - 32)}
    >
      {countries.map((c, i) => (
        <BarRow
          key={c.country}
          country={c.country}
          count={c.count}
          ratio={c.count / maxCount}
          rank={i}
          containerWidth={containerWidth}
        />
      ))}
      {extraCountries > 0 && (
        <Text className="text-text-muted text-xs mt-2">
          y {extraCountries} {extraCountries === 1 ? 'país más' : 'países más'}
        </Text>
      )}
    </View>
  );
}
