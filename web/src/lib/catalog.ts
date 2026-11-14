// The published catalog, read at build time from the staged gallery data
// (.generated/videos.json, written by scripts/stage.mjs from the repository catalog).
// Only the fields the UI reads are typed here; every one exists in the real file.
import data from '../../.generated/videos.json';

export interface Video {
  id: number;
  title: string;
  originalTitle: string;
  account: string;
  category: string;
  styles: string[];
  notes: string[];
  originalNotes: string[];
  date: string;
  source: string;
  quote: string;
  video: string;
  poster: string;
  clipSeconds: number;
  originalSeconds: number;
  excerpt: boolean;
  ratio: string;
  width: number;
  height: number;
  hasAudio: boolean;
  flag: string;
  snapshotDate: string;
  impressions: number;
  views: number | null;
  likes: number;
  bookmarks: number;
  reposts: number;
  replies: number;
  quotes: number;
  followers: number;
}

export const videos = data as unknown as Video[];

/** Sorted distinct values, the same way the gallery script builds its filter options. */
export const distinct = (values: string[]) => [...new Set(values)].sort();

export const totalImpressions = videos.reduce((sum, video) => sum + (video.impressions ?? 0), 0);
