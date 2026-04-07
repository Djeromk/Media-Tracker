import type { MediaStatus, UserMedia, ExternalGame, GameById } from "@/types";

/**
 * Создает объект обновления статуса для user_media
 */
export function createStatusUpdatePayload(status: MediaStatus) {
  return {
    status,
    is_finished: status === "completed" || status == "dropped",
    completed_at: status === "completed" ? new Date().toISOString() : null,
  };
}

/**
 * Находит запись userMedia по external_id
 */
export function findUserMediaEntry(
  userMedia: UserMedia[],
  externalId: string,
): UserMedia | null {
  return (
    userMedia.find((entry) => entry.media?.external_id === externalId) ?? null
  );
}

/**
 * Преобразует KinopoiskItemByID в ExternalMovie для добавления в медиа-библиотеку
 */
export function transformKinopoiskToExternalMovie(
  movie: {
    kinopoiskId: number;
    posterUrl: string;
    type: "FILM" | "TV_SHOW";
    imdbId: string;
    year: number;
    posterUrlPreview: string;
    nameRu: string;
    nameEn: string;
    nameOriginal: string;
    countries: { country: string }[];
    genres: { genre: string }[];
    ratingImdb: number;
    ratingKinopoisk: number;
	serial: boolean;
  },
) {
  return {
    id: movie.kinopoiskId?.toString() || "",
    thumbnail: movie.posterUrl,
    isSeries: movie.serial,
    imdbId: movie.imdbId,
    year: movie.year,
    type: movie.type,
    posterUrl: movie.posterUrl,
    posterUrlPreview: movie.posterUrlPreview,
    nameRu: movie.nameRu,
    nameEn: movie.nameEn,
    title: movie.nameRu || movie.nameEn || movie.nameOriginal,
    nameOriginal: movie.nameOriginal,
    countries: movie.countries,
    genres: movie.genres,
    ratingImdb: movie.ratingImdb,
    ratingKinopoisk: movie.ratingKinopoisk,
  };
}

export function transformGameToExternalGame(game: GameById): ExternalGame {
  return {
    id: game.id.toString() || "",
    name: game.name,
    background_image: game.background_image,
    thumbnail: game.background_image_additional,
    description: game.description,
    released: game.released,
    genres: game.esrb_rating?.name ? [game.esrb_rating.name] : [],
    platforms: game.platforms.map((platform) => platform.platform.name),
    developers: null,
    metacritic: game.metacritic,
  }
}

export function formatFilmLength(minutes: number | null | undefined): string {
  if (!minutes) return "";
  return `${minutes} мин`;
}

export function getMovieTitle(movie: {
  nameRu?: string;
  nameEn?: string;
  nameOriginal?: string;
}): string {
  return movie.nameRu || movie.nameEn || movie.nameOriginal || "";
}

export function getMovieOriginalTitle(movie: {
  nameRu?: string;
  nameEn?: string;
  nameOriginal?: string;
}): string | null {
  const mainTitle = movie.nameRu || movie.nameEn;
  if (movie.nameOriginal && movie.nameOriginal !== mainTitle) {
    return movie.nameOriginal;
  }
  return null;
}

export const getOptimizedImage = (src: string, width = 640, quality = 75): string => {
  if (!src) return '';

  if (import.meta.env.DEV || import.meta.env.VITE_ENV === 'development') return src;

  if (src.startsWith('/')) return src;

  const params = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: quality.toString(),
  });

  return `/_vercel/image?${params.toString()}`;
};
