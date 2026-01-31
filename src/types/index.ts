export type MediaType = "movie" | "book" | "game";
export type MediaStatus =
  | "completed"
  | "dropped"
  | "in_progress"
  | "backlog";

export interface BaseMedia {
  id: string;
  type: MediaType;
  title: string;
  coverUrl: string | null;
  cover_url: string | null;
  externalId: string | null;
  external_id: string | null;
  isCustom: boolean;
  createdBy: string | null;
  createdAt: string;
}

// Фильм/Сериал
export interface Movie extends BaseMedia {
  type: "movie";
  // director: string | null;
  // durationMinutes: number | null;
  releaseYear: number | null;
  isSeries: boolean;
  cover_url: string | null;
  // seasonsCount: number | null;
  // episodesCount: number | null;
}

export interface KinopoiskItem {
  kinopoiskId: number;
  imdbId: string;
  nameRu: string;
  nameEn: string;
  nameOriginal: string;
  countries: { countries: string }[];
  genres: { genre: string }[];
  ratingKinopoisk: number;
  ratingImdb: number;
  year: number;
  type: string; // FILM TV_SHOW ....
  posterUrl: string;
  posterUrlPreview: string;
}

// Книга
export interface Book extends BaseMedia {
  type: "book";
  author: string | null;
  pages: number | null;
  isbn: string | null;
}

export interface GoogleBooksItem {
  kind: "books#volume";
  id: string;
  etag: string;
  selfLink: string;
  volumeInfo: {
    title: string;
    subtitle: string;
    authors: [string];
    publisher: string;
    publishedDate: string;
    description: string;
    industryIdentifiers: [
      {
        type: string;
        identifier: string;
      },
    ];
    pageCount: number;
    dimensions: {
      height: string;
      width: string;
      thickness: string;
    };
    printType: string;
    mainCategory: string;
    categories: [string];
    averageRating: number;
    ratingsCount: number;
    contentVersion: string;
    imageLinks: {
      smallThumbnail: string;
      thumbnail: string;
      small: string;
      medium: string;
      large: string;
      extraLarge: string;
    };
    language: string;
    previewLink: string;
    infoLink: string;
    canonicalVolumeLink: string;
  };
  userInfo: {
    review: unknown;
    readingPosition: unknown;
    isPurchased: boolean;
    isPreordered: boolean;
    updated: string;
  };
  saleInfo: {
    country: string;
    saleability: string;
    onSaleDate: string;
    isEbook: boolean;
    listPrice: {
      amount: string;
      currencyCode: string;
    };
    retailPrice: {
      amount: string;
      currencyCode: string;
    };
    buyLink: string;
  };
  accessInfo: {
    country: string;
    viewability: string;
    embeddable: boolean;
    publicDomain: boolean;
    textToSpeechPermission: string;
    epub: {
      isAvailable: boolean;
      downloadLink: string;
      acsTokenLink: string;
    };
    pdf: {
      isAvailable: boolean;
      downloadLink: string;
      acsTokenLink: string;
    };
    webReaderLink: string;
    accessViewStatus: string;
    downloadAccess: {
      kind: "books#downloadAccessRestriction";
      volumeId: string;
      restricted: boolean;
      deviceAllowed: boolean;
      justAcquired: boolean;
      maxDownloadDevices: number;
      downloadsAcquired: number;
      nonce: string;
      source: string;
      reasonCode: string;
      message: string;
      signature: string;
    };
  };
  searchInfo: {
    textSnippet: string;
  };
}

// Игра
export interface Game extends BaseMedia {
  type: "game";
  developer: string | null;
  platform: string[] | null;
  genre: string[] | null;
}

// Union type для всех медиа
export type MediaItem = Movie | Book | Game;

// Связь пользователя с медиа
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
}

// Статистика для Dashboard
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

// Данные из внешних API
export interface ExternalMovie {
  id: string;
  title: string;
  posterPath: string | null;
  overview: string;
  releaseDate: string;
  director?: string;
  runtime?: number;
}

export interface ExternalBook {
  id: string;
  title: string;
  authors: string[];
  thumbnail: string | null;
  description: string;
  pageCount?: number;
  isbn?: string;
}

export interface ExternalGame {
  id: string;
  name: string;
  background_image: string | null;
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
  id: string
  name: string
 // nickname: string
  createdAt: string
}
export interface SignUpData {
  email: string
  password: string
  name: string
 // nickname: string
}
export interface SignInData {
  email: string
  password: string
}
export interface UserWithProfile extends User {
  profile: UserProfile | null
}

export const STATUS_LABELS: Record<MediaStatus, string> = {
  backlog: 'Бэклог',
  in_progress: 'В процессе',
  completed: 'Завершенные',
  dropped: 'Брошенные'
}

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  movie: 'Фильмы и Сериалы',
  book: 'Книги',
  game: 'Игры'
}

export const MEDIA_TYPE_ICONS: Record<MediaType, string> = {
  movie: '🎬',
  book: '📖',
  game: '🎮'
}
