import type {
	MediaType,
	MediaStatus,
	ExternalBook,
	ExternalGame,
	KinopoiskItem,
  } from "@/types";

  import { useMediaStore } from "@/stores/media";

  const mediaStore = useMediaStore()

function getItemId(item: KinopoiskItem | ExternalBook | ExternalGame): string {
	return 'id' in item ? item.id : Math.random().toString()
  }

  function alreadyAdded(item: KinopoiskItem | ExternalBook | ExternalGame): boolean {
	const searchItemId = getItemId(item).toString()
	return mediaStore.userMedia.some(
	  (userMediaItem) => userMediaItem.media?.external_id === searchItemId
	)
  }

  function getExistingStatus(item: KinopoiskItem | ExternalBook | ExternalGame): MediaStatus | null {
	const searchItemId = getItemId(item).toString()
	const existingItem = mediaStore.userMedia.find(
	  (userMediaItem) => userMediaItem.media?.external_id === searchItemId
	)
	return existingItem ? existingItem.status : null
  }

  function getTitle(item: KinopoiskItem | ExternalBook | ExternalGame): string {
	if ("title" in item) return item.title;
	if ("name" in item) return item.name;
	return "";
  }

  function getImage(
	item: KinopoiskItem | ExternalBook | ExternalGame,
  ): string | null {
	if ("posterUrl" in item && item.posterUrl) return item.posterUrl;
	if ("thumbnail" in item) return item.thumbnail;
	if ("background_image" in item) return item.background_image;
	return null;
  }

  function getSubtitle(
	item: KinopoiskItem | ExternalBook | ExternalGame,
  ): string {
	if ("authors" in item && item.authors.length > 0) {
	  return item.authors.join(", ");
	}
	return "";
  }
  function getMetacritic(item: ExternalGame): number {
	if ("metacritic" in item && item.metacritic) {
	  return item.metacritic;
	}
	return 0;
  }
  function getReleaseDate(
	item: KinopoiskItem | ExternalBook | ExternalGame,
  ): string {
	if ("year" in item && item.year) {
	  return item.year.toString();
	}
	return "";
  }


  export {
	getItemId,
	alreadyAdded,
	getExistingStatus,
	getTitle,
	getImage,
	getSubtitle,
	getMetacritic,
	getReleaseDate
  }
