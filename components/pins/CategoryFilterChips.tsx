import { memo } from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import TagIcon from '../ui/TagIcon';
import { TAG_ICONS } from '../../lib/tagIcons';

interface Props {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

const CATEGORIES = Object.keys(TAG_ICONS);

function CategoryFilterChips({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      className="mb-3"
    >
      {/* "Todos" chip */}
      <TouchableOpacity
        onPress={() => onSelect(null)}
        className={`flex-row items-center px-3 py-1.5 rounded-full ${
          selected === null ? 'bg-accent' : 'bg-surface-card'
        }`}
      >
        <Text
          className={`text-xs font-medium ${
            selected === null ? 'text-surface' : 'text-text-secondary'
          }`}
        >
          Todos
        </Text>
      </TouchableOpacity>

      {CATEGORIES.map((category) => {
        const isActive = selected === category;
        return (
          <TouchableOpacity
            key={category}
            onPress={() => onSelect(isActive ? null : category)}
            className={`flex-row items-center px-3 py-1.5 rounded-full gap-1.5 ${
              isActive ? 'bg-accent' : 'bg-surface-card'
            }`}
          >
            <TagIcon
              tagName={category}
              size={12}
              color={isActive ? '#0f0f0f' : '#909090'}
            />
            <Text
              className={`text-xs font-medium ${
                isActive ? 'text-surface' : 'text-text-secondary'
              }`}
            >
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

export default memo(CategoryFilterChips);
