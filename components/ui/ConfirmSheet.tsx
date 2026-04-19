import { View, Text, TouchableOpacity, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../contexts/ThemeContext';

interface Props {
  visible: boolean;
  icon: string;
  iconColor?: string;
  title: string;
  body?: string;
  confirmLabel: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmSheet({
  visible,
  icon,
  iconColor,
  title,
  body,
  confirmLabel,
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const confirmColor = isDestructive ? colors.danger : colors.accent;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onPress={onCancel}
      >
        <Pressable onPress={() => {}}>
          <View
            className="bg-surface rounded-t-3xl px-5 pt-5"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <View className="w-10 h-1 rounded-full bg-surface-elevated self-center mb-5" />

            <View
              className="w-12 h-12 rounded-full bg-surface-card items-center justify-center self-center mb-4"
            >
              <Ionicons name={icon as any} size={24} color={iconColor ?? confirmColor} />
            </View>

            <Text className="text-text-primary text-base font-semibold text-center mb-1">
              {title}
            </Text>
            {body && (
              <Text className="text-text-muted text-sm text-center mb-6">{body}</Text>
            )}
            {!body && <View className="mb-6" />}

            <TouchableOpacity
              onPress={onConfirm}
              disabled={isLoading}
              className="rounded-2xl py-4 items-center mb-3 flex-row justify-center"
              style={{ gap: 8, opacity: isLoading ? 0.7 : 1, backgroundColor: confirmColor }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name={icon as any} size={18} color="#fff" />
              )}
              <Text className="text-white text-base font-semibold">
                {isLoading ? 'Un momento...' : confirmLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onCancel}
              disabled={isLoading}
              className="bg-surface-card rounded-2xl py-4 items-center"
            >
              <Text className="text-text-primary text-base font-medium">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
