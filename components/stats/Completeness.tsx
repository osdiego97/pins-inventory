import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Completeness as CompletenessType } from '../../hooks/useStats';
import { useThemeColors } from '../../contexts/ThemeContext';

const ANIMATION_DURATION = 800;
const STAGGER_MS = 100;

interface RowProps {
  label: string;
  ratio: number;
  rank: number;
}

function CompletenessRow({ label, ratio, rank }: RowProps) {
  const colors = useThemeColors();
  const progress = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      progress.value = withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.cubic) });
    }, rank * STAGGER_MS);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${ratio * 100 * progress.value}%`,
  }));

  const pct = Math.round(ratio * 100);
  const barColor = pct >= 80 ? colors.success : pct >= 50 ? colors.accent : colors.danger;

  return (
    <View className="py-2">
      <View className="flex-row justify-between mb-1.5">
        <Text className="text-text-secondary text-sm">{label}</Text>
        <Text className="text-text-primary text-sm font-semibold">{pct}%</Text>
      </View>
      <View className="h-1.5 rounded-full overflow-hidden bg-surface">
        <Animated.View style={[animatedStyle, { height: '100%', borderRadius: 4, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

interface Props {
  data: CompletenessType;
}

export default function Completeness({ data }: Props) {
  return (
    <View className="px-4">
      <CompletenessRow label="Con foto" ratio={data.withPhoto} rank={0} />
      <CompletenessRow label="Con categoría" ratio={data.withCategory} rank={1} />
      <CompletenessRow label="Con año" ratio={data.withYear} rank={2} />
    </View>
  );
}
