import type { MediaStatus, UserMedia } from "@/types";

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
    id: movie.kinopoiskId.toString(),
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
