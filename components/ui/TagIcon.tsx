import { Ionicons } from '@expo/vector-icons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { TAG_ICONS } from '../../lib/tagIcons';

interface TagIconProps {
  tagName: string;
  size: number;
  color: string;
  // Icon name stored on the tag record (Ionicons). Takes priority over TAG_ICONS lookup.
  tagIcon?: string | null;
}

export default function TagIcon({ tagName, size, color, tagIcon }: TagIconProps) {
  if (tagIcon) {
    return <Ionicons name={tagIcon as any} size={size} color={color} />;
  }

  const icon = TAG_ICONS[tagName];
  if (!icon) return null;

  if (icon.library === 'FontAwesome6') {
    return <FontAwesome6 name={icon.name as any} size={size} color={color} />;
  }
  return <Ionicons name={icon.name as any} size={size} color={color} />;
}
