import type { KinopoiskItem, ExternalMovie, KinopoiskItemByID, KinopoiskTVSeason } from "@/types";

const API_KEY = import.meta.env.VITE_KINOPOISK_API_KEY;
const BASE_URL = "https://kinopoiskapiunofficial.tech";

export class Kinopoisk {
  async searchMovies(query: string): Promise<ExternalMovie[]> {
    const headers: HeadersInit = {
      "X-API-KEY": API_KEY,
      "Content-Type": "application/json",
    };
    const response = await fetch(
      `${BASE_URL}/api/v2.2/films?order=NUM_VOTE&type=ALL&ratingFrom=0&ratingTo=10&yearFrom=1000&yearTo=3000&keyword=${query}&page=1`,
      {
        method: "GET",
        headers,
      },
    );
    const data = await response.json();
    return data.items.map((item: KinopoiskItem) => ({
      id: item.kinopoiskId.toString(),
      title: item.nameRu || item.nameOriginal,
      thumbnail: item.posterUrlPreview || item.posterUrl || null,
      releaseDate: item.year,
      isSeries: item.type === "TV_SERIES",
      year: item.year.toString(),
      ratingImdb: item.ratingImdb,
      ratingKinopoisk: item.ratingKinopoisk,
      other: item
    }));
  }

  async searchMovieByID(id: string): Promise<KinopoiskItemByID> {
    const headers: HeadersInit = {
      "X-API-KEY": API_KEY,
      "Content-Type": "application/json",
    };
    const response = await fetch(
      `${BASE_URL}/api/v2.2/films/${id}`,
      {
        method: "GET",
        headers,
      },
    );
    const data = await response.json();
    return data
  }

  async getTVSeasons(id: string): Promise<KinopoiskTVSeason[]> {
    const headers: HeadersInit = {
      "X-API-KEY": API_KEY,
      "Content-Type": "application/json",
    };
    const response = await fetch(
      `${BASE_URL}/api/v2.2/films/${id}/seasons`,
      {
        method: "GET",
        headers,
      },
    );
    const data = await response.json();
    return data.items;
  }
}
export const kinopoiskService = new Kinopoisk();
