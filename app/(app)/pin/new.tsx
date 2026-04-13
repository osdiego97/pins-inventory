import { View, Text, TouchableOpacity } from 'react-native';
import { router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PinForm from '../../../components/pins/PinForm';
import { useThemeColors } from '../../../contexts/ThemeContext';

export default function NewPinScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text className="text-text-primary text-lg font-semibold">Nuevo elemento</Text>
        </View>
        <PinForm />
      </View>
    </>
  );
}
