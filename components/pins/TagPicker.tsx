import { View, Text, TouchableOpacity } from 'react-native';
import { TagGroup } from '../../hooks/useTags';
import { TAG_ICONS } from '../../lib/tagIcons';
import TagIcon from '../ui/TagIcon';

interface TagPickerProps {
  tagGroups: TagGroup[];
  selectedIds: string[];
  onToggle: (tagId: string) => void;
}

export default function TagPicker({ tagGroups, selectedIds, onToggle }: TagPickerProps) {
  return (
    <View style={{ gap: 16 }}>
      {tagGroups.map(({ category, subcategories }) => (
        <View key={category.id}>
          <TouchableOpacity
            onPress={() => onToggle(category.id)}
            className={`self-start rounded-full px-3 py-1.5 mb-2 flex-row items-center ${
              selectedIds.includes(category.id) ? 'bg-accent' : 'bg-surface-elevated'
            }`}
            style={{ gap: 6 }}
          >
            <TagIcon
              tagName={category.name}
              size={13}
              color={selectedIds.includes(category.id) ? '#0f0f0f' : '#f5f5f5'}
            />
            <Text
              className={`text-sm font-semibold ${
                selectedIds.includes(category.id) ? 'text-surface' : 'text-text-primary'
              }`}
            >
              {category.name.toUpperCase()}
            </Text>
          </TouchableOpacity>

          {subcategories.length > 0 && (
            <View className="flex-row flex-wrap pl-2" style={{ gap: 8 }}>
              {subcategories.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => onToggle(sub.id)}
                  className={`rounded-full px-3 py-1.5 ${
                    selectedIds.includes(sub.id) ? 'bg-accent-muted' : 'bg-surface-card'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      selectedIds.includes(sub.id) ? 'text-surface' : 'text-text-secondary'
                    }`}
                  >
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
