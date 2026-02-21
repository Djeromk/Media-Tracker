// src/types/series.ts
export interface KinopoiskTVSeason {
	number: number;
	episodes: KinopoiskTVEpisode[];
  }

  export interface KinopoiskTVEpisode {
	seasonNumber: number;
	episodeNumber: number;
	nameRu: string;
	nameEn: string;
	synopsis: string;
  }
export type WatchedEpisodesMap = {
	[seasonNumber: string]: number[];
  };

  export interface SeasonProgress {
	seasonNumber: number;
	totalEpisodes: number;
	watchedEpisodes: number[];
	watchedCount: number;
	isCompleted: boolean;
	completionPercentage: number;
  }

  export interface SeriesProgress {
	totalSeasons: number;
	totalEpisodes: number;
	watchedEpisodes: number;
	completionPercentage: number;
	current_season: number | null;
	current_episode: number | null;
	seasons: SeasonProgress[];
  }

