import { View, Text, TouchableOpacity } from 'react-native';
import { TagGroup } from '../../hooks/useTags';
import TagIcon from '../ui/TagIcon';
import { Tag } from '../../lib/types';

interface TagPickerProps {
  tagGroups: TagGroup[];
  standaloneTags?: Tag[];
  selectedIds: string[];
  onToggle: (tagId: string, parentId?: string) => void;
}

export default function TagPicker({ tagGroups, standaloneTags = [], selectedIds, onToggle }: TagPickerProps) {
  const isEmpty = tagGroups.length === 0 && standaloneTags.length === 0;

  if (isEmpty) {
    return (
      <View className="bg-surface-card rounded-xl px-4 py-3">
        <Text className="text-text-muted text-sm text-center">
          Aún no tienes categorías. Crea una desde Ajustes.
        </Text>
      </View>
    );
  }

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
              tagIcon={category.icon}
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

          {(subcategories.length > 0 || standaloneTags.length > 0) && (
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
              {standaloneTags.map((tag) => {
                // A shared tag appears selected under this L1 only if both the tag
                // and this L1 are selected — prevents all copies lighting up at once
                const selectedInThisContext =
                  selectedIds.includes(tag.id) && selectedIds.includes(category.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    onPress={() => onToggle(tag.id, category.id)}
                    className={`rounded-full px-3 py-1.5 ${
                      selectedInThisContext ? 'bg-accent-muted' : 'bg-surface-card'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        selectedInThisContext ? 'text-surface' : 'text-text-secondary'
                      }`}
                    >
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      ))}

      {/* Shared subcategories shown standalone when there are no L1 groups */}
      {tagGroups.length === 0 && standaloneTags.length > 0 && (
        <View>
          <Text className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2">
            Subcategorías compartidas
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 8 }}>
            {standaloneTags.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                onPress={() => onToggle(tag.id)}
                className={`rounded-full px-3 py-1.5 ${
                  selectedIds.includes(tag.id) ? 'bg-accent-muted' : 'bg-surface-card'
                }`}
              >
                <Text
                  className={`text-sm ${
                    selectedIds.includes(tag.id) ? 'text-surface' : 'text-text-secondary'
                  }`}
                >
                  {tag.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
