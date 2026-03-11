import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Pin, Tag } from '../lib/types';

type RawPinTag = {
  tags: Tag | null;
};

type RawPin = Omit<Pin, 'tags'> & {
  pin_tags: RawPinTag[];
};

export function usePins() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPins();
  }, []);

  async function fetchPins() {
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
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError('No se pudieron cargar los pins.');
      setLoading(false);
      return;
    }

    const mapped: Pin[] = (data as RawPin[]).map((row) => ({
      id: row.id,
      user_id: row.user_id,
      description: row.description,
      country: row.country,
      city: row.city,
      region: row.region,
      image_url: row.image_url,
      acquired_year: row.acquired_year,
      is_commemorative: row.is_commemorative,
      created_at: row.created_at,
      tags: row.pin_tags.map((pt) => pt.tags).filter((t): t is Tag => t !== null),
    }));

    setPins(mapped);
    setLoading(false);
  }

  return { pins, loading, error, refetch: fetchPins };
}
