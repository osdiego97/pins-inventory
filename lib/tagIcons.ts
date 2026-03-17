export type IconLibrary = 'Ionicons' | 'FontAwesome6';

export interface TagIcon {
  name: string;
  library: IconLibrary;
}

export const TAG_ICONS: Record<string, TagIcon> = {
  'Geografía':        { name: 'globe-outline',        library: 'Ionicons' },
  'Turismo':          { name: 'camera-outline',        library: 'Ionicons' },
  'Fútbol':           { name: 'football-outline',      library: 'Ionicons' },
  'Series y Películas': { name: 'film-outline',        library: 'Ionicons' },
  'Hard Rock':        { name: 'guitar',                library: 'FontAwesome6' },
  'Música':           { name: 'musical-notes-outline', library: 'Ionicons' },
  'Marcas':           { name: 'pricetag-outline',      library: 'Ionicons' },
  'Militar':          { name: 'person-military-rifle',  library: 'FontAwesome6' },
  'Símbolos':         { name: 'shapes-outline',        library: 'Ionicons' },
  'Animales':         { name: 'paw-outline',           library: 'Ionicons' },
  'Objetos':          { name: 'cube-outline',          library: 'Ionicons' },
};
