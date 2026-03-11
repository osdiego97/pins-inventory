import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Pin, Tag } from '../lib/types';

type RawPinTag = {
  tags: Tag | null;
};

type RawPin = Omit<Pin, 'tags'> & {
  pin_tags: RawPinTag[];
};

export function usePinDetail(id: string | string[] | undefined) {
  const [pin, setPin] = useState<Pin | null>(null);
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
      .from('pins')
      .select(`
        *,
        pin_tags (
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
      setError('No se pudo cargar el pin.');
      setLoading(false);
      return;
    }

    const row = data as RawPin;
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
      created_at: row.created_at,
      tags: row.pin_tags.map((pt) => pt.tags).filter((t): t is Tag => t !== null),
    });
    setLoading(false);
  }

  return { pin, loading, error };
}
