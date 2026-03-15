import { Ionicons } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { TAG_ICONS } from '../../lib/tagIcons';

interface TagIconProps {
  tagName: string;
  size: number;
  color: string;
}

export default function TagIcon({ tagName, size, color }: TagIconProps) {
  const icon = TAG_ICONS[tagName];
  if (!icon) return null;

  if (icon.library === 'FontAwesome6') {
    return <FontAwesome6 name={icon.name as any} size={size} color={color} />;
  }
  return <Ionicons name={icon.name as any} size={size} color={color} />;
}
