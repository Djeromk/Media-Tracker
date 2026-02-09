import { db } from "./supabase";
import type {
  MediaType,
  MediaStatus,
  ExternalMovie,
  ExternalBook,
  ExternalGame,
} from "@/types";

interface CreateMediaFromExternalParams {
  item: ExternalMovie | ExternalBook | ExternalGame;
  type: MediaType;
  userId: string | null;
  status?: MediaStatus;
}

export const mediaService = {
  /**
   * Создает или находит существующий медиа элемент и добавляет его в список пользователя
   */
  async createMediaFromExternal(params: CreateMediaFromExternalParams) {
    const { item, type, userId, status = "backlog" } = params;

    try {
      const external_id = "id" in item ? item.id : null;
      if (!external_id) {
        throw new Error("External ID is missing");
      }
      const { data: existingMedia, error: findError } =
        await db.getMediaByExternalId(external_id, type);
      if (findError) {
        throw findError;
      }
      let mediaId: string;
      if (existingMedia) {
        mediaId = existingMedia.id;
      } else {
        console.log("Creating new media item...", item);
        const mediaData = this.prepareMediaData(item, type, userId);
        const { data: newMedia, error: createError } =
          await db.createMediaItem(mediaData);

        if (createError || !newMedia) {
          console.error("Error creating media_item:", createError);
          throw createError || new Error("Failed to create media item");
        }

        mediaId = newMedia.id;
        console.log("Created media_item with ID:", mediaId);

        // Создаем специфичные данные в зависимости от типа
        await this.createTypeSpecificData(item, type, mediaId);
        console.log("Created type-specific data for type:", type);
      }

      if (userId) {
        console.log("Adding to user media...");
        const { error: addError } = await db.addUserMedia({
          userId,
          mediaId,
          status,
        });

        if (addError) {
          // Проверяем, не добавлен ли уже этот элемент (UNIQUE constraint)
          if (addError.code !== "23505") {
            console.log("Media already in user list");
            return {
              success: true,
              mediaId,
              message: "This item is already in your list",
            };
          }
          throw addError;
        }
      }

      return { success: true, mediaId };
    } catch (error) {
      console.error("Error creating media:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  prepareMediaData(
    item: ExternalMovie | ExternalBook | ExternalGame,
    type: MediaType,
    userId: string | null
  ) {
    let title = "";
    let coverUrl: string | null = null;
    const external_id = "id" in item ? item.id : null;
    if ("title" in item) {
      title = item.title;
    } else if ("name" in item) {
      title = item.name;
    }
    if ("thumbnail" in item) {
      coverUrl = item.thumbnail;
    }

    return {
      type,
      title,
      coverUrl,
      external_id,
      isCustom: false,
      createdBy: userId,
    };
  },

  /**
   * Создает специфичные данные в зависимости от типа медиа
   */
  async createTypeSpecificData(
    item: ExternalMovie | ExternalBook | ExternalGame,
    type: MediaType,
    mediaId: string
  ) {
    switch (type) {
      case "movie": {
        const movieItem = item as ExternalMovie;
        await db.createMovie({
          id: mediaId,
          //director: movieItem.director || null,
          //durationMinutes: movieItem.runtime || null,
          year: movieItem.year,
          isSeries: movieItem.isSeries,
          // seasonsCount: 'seasonsCount' in movieItem ? movieItem.seasonsCount || null : null,
          //episodesCount: 'episodesCount' in movieItem ? movieItem.episodesCount || null : null
        });
        break;
      }

      case "book": {
        const bookItem = item as ExternalBook;
        await db.createBook({
          id: mediaId,
          author: bookItem.authors.join(", ") || null,
          pages: bookItem.pageCount || null,
          isbn: bookItem.isbn || null,
        });
        break;
      }

      case "game": {
        const gameItem = item as ExternalGame;
        await db.createGame({
          id: mediaId,
          //developer: gameItem.developers.jo
          platform: gameItem.platforms || null,
          genre: gameItem.genres || null,
        });
        break;
      }
    }
  },
};
