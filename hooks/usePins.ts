import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Item, Tag } from '../lib/types';

type RawItemTag = {
  tags: Tag | null;
};

type RawItem = Omit<Item, 'tags'> & {
  item_tags: RawItemTag[];
};

export function usePins() {
  const [pins, setPins] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPins();
  }, []);

  const fetchPins = useCallback(async function () {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('items')
      .select(`
        *,
        item_tags (
          tags (
            id,
            name,
            parent_id,
            icon
          )
        )
      `)
      .order('collection_number', { ascending: true, nullsFirst: false });

    if (fetchError) {
      setError('No se pudieron cargar los elementos.');
      setLoading(false);
      return;
    }

    const mapped: Item[] = (data as RawItem[]).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      description: row.description,
      country: row.country,
      city: row.city,
      region: row.region,
      image_url: row.image_url,
      acquired_year: row.acquired_year,
      is_commemorative: row.is_commemorative,
      collection_number: row.collection_number,
      created_at: row.created_at,
      latitude: row.latitude,
      longitude: row.longitude,
      material: row.material,
      color: row.color,
      tags: row.item_tags.map((pt) => pt.tags).filter((t): t is Tag => t !== null),
    }));

    setPins(mapped);
    setLoading(false);
  }, []);

  return { pins, loading, error, refetch: fetchPins };
}
