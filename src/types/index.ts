export * from "./movie";
export * from "./book";
export * from "./series";

export type MediaType = "movie" | "book" | "game" | "other";
export type MediaStatus = "completed" | "dropped" | "in_progress" | "backlog";
export type MediaItem = Movie | Book | Game;

export interface BaseMedia {
  id: string;
  type: MediaType;
  title: string;
  coverUrl: string | null;
  cover_url: string | null;
  external_id: string | null;
  isCustom: boolean;
  createdBy: string | null;
  createdAt: string;
}

export interface Movie extends BaseMedia {
  type: "movie";
  releaseYear: number | null;
  isSeries: boolean;
  cover_url: string | null;
}

export interface Book extends BaseMedia {
  type: "book";
  author: string | null;
  pages: number | null;
  isbn: string | null;
}

export interface Game extends BaseMedia {
  type: "game";
  developer: string | null;
  platform: string[] | null;
  genre: string[] | null;
}

export interface UserMedia {
  id: string;
  userId: string;
  mediaId: string;
  status: MediaStatus;
  rating: number | null;
  review: string | null;
  is_finished: boolean;
  started_at: string | null;
  completed_at: string | null;
  createdAt: string;
  updatedAt: string;
  media?: MediaItem;
  current_page: number | null;
  currentPage: number | null;
  currentSeason: number | null;
  currentEpisode: number | null;
  hoursPlayed: number | null;
  watched_episodes: WatchedEpisodesMap;
}

type WatchedEpisodesMap = {
  [seasonNumber: string]: number[];
};
export interface MediaStats {
  total: number;
  completed: number;
  inProgress: number;
  backlog: number;
  dropped: number;
}

export interface DashboardStats {
  movies: MediaStats;
  books: MediaStats;
  games: MediaStats;
  overall: {
    totalItems: number;
    completedItems: number;
  };
}

export interface ExternalGame {
  id: string;
  name: string;
  background_image: string | null;
  thumbnail: string;
  description: string;
  released: string;
  genres: string[];
  platforms: string[];
  developers: string[] | null;
  metacritic: number;
}
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  // nickname: string
  createdAt: string;
}
export interface SignUpData {
  email: string;
  password: string;
  name: string;
}
export interface SignInData {
  email: string;
  password: string;
}
export interface UserWithProfile extends User {
  profile: UserProfile | null;
}

export const STATUS_LABELS: Record<MediaStatus, string> = {
  backlog: "Бэклог",
  in_progress: "В процессе",
  completed: "Завершенные",
  dropped: "Брошенные",
};

export const BOOKS_STATUS_LABELS: Record<MediaStatus, string> = {
  backlog: "Хочу прочитать",
  in_progress: "Читаю",
  completed: "Прочитано",
  dropped: "Брошенно",
};

export const FILMS_STATUS_LABELS: Record<MediaStatus, string> = {
  backlog: "Хочу посмотреть",
  in_progress: "Смотрю",
  completed: "Просмотрено",
  dropped: "Брошенно",
};

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  movie: "Фильмы и Сериалы",
  book: "Книги",
  game: "Игры",
  other: "Другое",
};

export const MEDIA_TYPE_ICONS: Record<MediaType, string> = {
  movie: "🎬",
  book: "📖",
  game: "🎮",
  other: "📦",
};
