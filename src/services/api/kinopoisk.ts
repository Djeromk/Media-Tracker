import type { KinopoiskItem } from "@/types";

const API_KEY = import.meta.env.VITE_KINOPOISK_API_KEY;
const BASE_URL = "https://kinopoiskapiunofficial.tech";

export class Kinopoisk {
  async searchMovies(query: string): Promise<KinopoiskItem[]> {
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
      posterPath: item.posterUrl || item.posterUrlPreview,
      releaseDate: item.year,
      isSeries: item.type === "TV_SHOW",
    }));
  }
}
export const kinopoiskService = new Kinopoisk();
