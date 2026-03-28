export interface Pin {
  id: string;
  user_id: string;
  description: string;
  city?: string;
  country?: string;
  region?: string;
  image_url?: string;
  acquired_year?: number;
  is_commemorative: boolean;
  collection_number?: number;
  created_at: string;
  tags?: Tag[];
  latitude?: number;
  longitude?: number;
}

export interface Tag {
  id: string;
  name: string;
  parent_id?: string;
  parent?: Tag;
}

export interface PinTag {
  id: string;
  pin_id: string;
  tag_id: string;
  user_id: string;
}

export interface FilterState {
  l1: string[];
  l2: string[];
  country: string | null;
  city: string | null;
  year: number | null;
}
