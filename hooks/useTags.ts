import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Tag } from '../lib/types';

export interface TagGroup {
  category: Tag;
  subcategories: Tag[];
}

export function useTags() {
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [standaloneTags, setStandaloneTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = useCallback(async function () {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('tags')
      .select('id, name, parent_id, user_id, is_shared, icon')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error || !data) {
      setLoading(false);
      return;
    }

    const all = data as Tag[];
    const l1Tags = all.filter((t) => !t.parent_id && !t.is_shared);
    const l2WithParent = all.filter((t) => !!t.parent_id);
    const standaloneL2 = all.filter((t) => !t.parent_id && !!t.is_shared);

    const groups: TagGroup[] = l1Tags.map((cat) => ({
      category: cat,
      subcategories: l2WithParent.filter((t) => t.parent_id === cat.id),
    }));

    setTagGroups(groups);
    setStandaloneTags(standaloneL2);
    setLoading(false);
  }, []);

  return { tagGroups, standaloneTags, loading, refetch: fetchTags };
}
