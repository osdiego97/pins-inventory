import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Tag } from '../lib/types';

export interface TagGroup {
  category: Tag;
  subcategories: Tag[];
}

export function useTags() {
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTags() {
      const { data, error } = await supabase
        .from('tags')
        .select('id, name, parent_id')
        .order('name', { ascending: true });

      if (error || !data) {
        setLoading(false);
        return;
      }

      const all = data as Tag[];
      const categories = all.filter((t) => !t.parent_id);
      const groups: TagGroup[] = categories.map((cat) => ({
        category: cat,
        subcategories: all.filter((t) => t.parent_id === cat.id),
      }));

      setTagGroups(groups);
      setLoading(false);
    }

    fetchTags();
  }, []);

  return { tagGroups, loading };
}
