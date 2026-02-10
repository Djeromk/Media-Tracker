// src/utils/seriesUtils.ts

import type {
	KinopoiskTVSeason,
	WatchedEpisodesMap,
	SeriesProgress,
	SeasonProgress
  } from '@/types';

  /**
   * Вычисляет полный прогресс просмотра сериала
   */
  export function calculateSeriesProgress(
	seasons: KinopoiskTVSeason[],
	watchedEpisodes: WatchedEpisodesMap
  ): SeriesProgress {
	console.log('calculateSeriesProgress seasons', seasons)
	console.log('calculateSeriesProgress watchedEpisodes', watchedEpisodes)
	const seasonProgress: SeasonProgress[] = seasons.map(season => {
	  const watched = watchedEpisodes[season.number.toString()] || [];
	  console.log('watched', watched)
	  const total = season.episodes.length;

	  return {
		seasonNumber: season.number,
		totalEpisodes: total,
		watchedEpisodes: watched,
		watchedCount: watched.length,
		isCompleted: watched.length === total,
		completionPercentage: Math.round((watched.length / total) * 100)
	  };
	});

	const totalEpisodes = seasons.reduce((sum, s) => sum + s.episodes.length, 0);
	const watchedCount = seasonProgress.reduce((sum, s) => sum + s.watchedCount, 0);
	const current = findCurrentEpisode(seasons, watchedEpisodes);

	return {
	  totalSeasons: seasons.length,
	  totalEpisodes,
	  watchedEpisodes: watchedCount,
	  completionPercentage: Math.round((watchedCount / totalEpisodes) * 100),
	  currentSeason: current.season,
	  currentEpisode: current.episode,
	  seasons: seasonProgress
	};
  }

  /**
   * Находит первую непросмотренную серию
   * Логика: последовательно проходит по сезонам и сериям
   */
  export function findCurrentEpisode(
	seasons: KinopoiskTVSeason[],
	watchedEpisodes: WatchedEpisodesMap
  ): { season: number | null; episode: number | null } {
	for (const season of seasons) {
	  const watched = watchedEpisodes[season.number.toString()] || [];

	  for (const episode of season.episodes) {
		if (!watched.includes(episode.episodeNumber)) {
		  return {
			season: season.number,
			episode: episode.episodeNumber
		  };
		}
	  }
	}

	// Все серии просмотрены
	return { season: null, episode: null };
  }

  /**
   * Отмечает серию как просмотренную
   */
  export function markEpisodeWatched(
	watchedEpisodes: WatchedEpisodesMap,
	seasonNumber: number,
	episodeNumber: number
  ): WatchedEpisodesMap {
	const updated = { ...watchedEpisodes };
	const seasonKey = seasonNumber.toString();

	if (!updated[seasonKey]) {
	  updated[seasonKey] = [];
	}

	if (!updated[seasonKey].includes(episodeNumber)) {
	  updated[seasonKey] = [...updated[seasonKey], episodeNumber].sort((a, b) => a - b);
	}

	return updated;
  }

  /**
   * Снимает отметку с серии
   */
  export function markEpisodeUnwatched(
	watchedEpisodes: WatchedEpisodesMap,
	seasonNumber: number,
	episodeNumber: number
  ): WatchedEpisodesMap {
	const updated = { ...watchedEpisodes };
	const seasonKey = seasonNumber.toString();

	if (updated[seasonKey]) {
	  updated[seasonKey] = updated[seasonKey].filter(ep => ep !== episodeNumber);
	}

	return updated;
  }

  /**
   * Отмечает весь сезон как просмотренный
   */
  export function markSeasonWatched(
	watchedEpisodes: WatchedEpisodesMap,
	season: KinopoiskTVSeason
  ): WatchedEpisodesMap {
	const updated = { ...watchedEpisodes };
	const seasonKey = season.number.toString();

	updated[seasonKey] = season.episodes.map(ep => ep.episodeNumber);
	console.log('updated', updated);
	return updated;
  }

  /**
   * Снимает отметку со всего сезона
   */
  export function markSeasonUnwatched(
	watchedEpisodes: WatchedEpisodesMap,
	seasonNumber: number
  ): WatchedEpisodesMap {
	const updated = { ...watchedEpisodes };
	delete updated[seasonNumber.toString()];

	return updated;
  }

  /**
   * Проверяет, просмотрена ли серия
   */
  export function isEpisodeWatched(
	watchedEpisodes: WatchedEpisodesMap,
	seasonNumber: number,
	episodeNumber: number
  ): boolean {
	const watched = watchedEpisodes[seasonNumber.toString()] || [];
	return watched.includes(episodeNumber);
  }

  /**
   * Проверяет, просмотрен ли весь сезон
   */
  export function isSeasonWatched(
	watchedEpisodes: WatchedEpisodesMap,
	season: KinopoiskTVSeason
  ): boolean {
	const watched = watchedEpisodes[season.number.toString()] || [];
	return watched.length === season.episodes.length;
  }
