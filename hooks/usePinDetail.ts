import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Item, Tag } from '../lib/types';

type RawItemTag = {
  tags: Tag | null;
};

type RawItem = Omit<Item, 'tags'> & {
  item_tags: RawItemTag[];
};

export function usePinDetail(id: string | string[] | undefined) {
  const [pin, setPin] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pinId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    if (!pinId) return;
    fetchPin();
  }, [pinId]);

  async function fetchPin() {
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
            parent_id
          )
        )
      `)
      .eq('id', pinId)
      .single();

    if (fetchError) {
      setError('No se pudo cargar el elemento.');
      setLoading(false);
      return;
    }

    const row = data as RawItem;
    setPin({
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
      latitude: row.latitude,
      longitude: row.longitude,
      material: row.material,
      color: row.color,
      created_at: row.created_at,
      tags: row.item_tags.map((pt) => pt.tags).filter((t): t is Tag => t !== null),
    });
    setLoading(false);
  }

  return { pin, loading, error, refetch: fetchPin };
}
