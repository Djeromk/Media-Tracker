import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { db } from "@/services/supabase";
import { mediaService } from "@/services/mediaService";
import type {
  UserMedia,
  MediaType,
  MediaStatus,
  DashboardStats,
  ExternalGame,
  //KinopoiskItem,
  ExternalMovie,
  ExternalBook,
} from "@/types";
import { useAuthStore } from "./auth";
import type { PostgrestError } from "@supabase/supabase-js";

interface MediaResponse {
  success: boolean;
  error?: string;
  mediaId?: string;
  message?: string;
}

export const useMediaStore = defineStore("media", () => {
  const authStore = useAuthStore();

  const userMedia = ref<UserMedia[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Автоматически рассчитывает статистику на основе userMedia
  const stats = computed<DashboardStats>(() => {
    const calculateStats = (type: MediaType) => {
      const items = userMedia.value.filter((m) => m.media?.type === type);
      return {
        total: items.length,
        completed: items.filter((m) => m.status === "completed").length,
        inProgress: items.filter((m) => m.status === "in_progress").length,
        backlog: items.filter((m) => m.status === "backlog").length,
        dropped: items.filter((m) => m.status === "dropped").length,
      };
    };

    return {
      movies: calculateStats("movie"),
      books: calculateStats("book"),
      games: calculateStats("game"),
      overall: {
        totalItems: userMedia.value.length,
        completedItems: userMedia.value.filter((m) => m.status === "completed")
          .length,
      },
    };
  });

  // Вспомогательные геттеры для фильтрации
  const getMediaByType = (type: MediaType) => {
    return userMedia.value.filter((m) => m.media?.type === type);
  };

  const getMediaByStatus = (status: MediaStatus) => {
    return userMedia.value.filter((m) => m.status === status);
  };

  async function fetchUserMedia() {
    if (!authStore.user) return;
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await db.getUserMedia(
        authStore.user.id
      );
      if (fetchError) throw fetchError;
      userMedia.value = data as UserMedia[];
    } catch (e) {
      const dbError = e as PostgrestError;
      error.value = dbError.message;
    } finally {
      loading.value = false;
    }
  }

  async function addMediaFromExternal(
    item: ExternalMovie | ExternalBook | ExternalGame,
    type: MediaType,
    status: MediaStatus = "backlog"
  ): Promise<MediaResponse> {
    loading.value = true;
    error.value = null;

    try {
      const result = await mediaService.createMediaFromExternal({
        item,
        type,
        userId: authStore.user?.id || null,
        status,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to add media");
      }

      if (authStore.user) {
        await fetchUserMedia();
      }

      return {
        success: true,
        mediaId: result.mediaId,
        message: "Media added successfully",
      };
    } catch (e) {
      const err = e as Error;
      error.value = err.message;
      return {
        success: false,
        error: err.message,
        message: "Failed to add media",
      };
    } finally {
      loading.value = false;
    }
  }

  // Добавляет новый медиа элемент в список пользователя
  async function addMedia(
    mediaId: string,
    status: MediaStatus
  ): Promise<MediaResponse> {
    if (!authStore.user)
      return { success: false, error: "User not authenticated" };

    loading.value = true;
    error.value = null;
    try {
      const { error: addError } = await db.addUserMedia({
        userId: authStore.user.id,
        mediaId,
        status,
      });

      if (addError) throw addError;

      // Перезагружаем данные чтобы получить обновленный список
      await fetchUserMedia();
      return { success: true };
    } catch (e) {
      const dbError = e as PostgrestError;
      error.value = dbError.message;
      return { success: false, error: dbError.message };
    } finally {
      loading.value = false;
    }
  }

  // Обновляет существующий медиа элемент (рейтинг, статус, отзыв и т.д.)
  async function updateMedia(
    id: string,
    updates: Partial<UserMedia>
  ): Promise<MediaResponse> {
    loading.value = true;
    error.value = null;
    try {
      const { error: updateError } = await db.updateUserMedia(id, updates);

      if (updateError) throw updateError;

      await fetchUserMedia();
      return { success: true };
    } catch (e) {
      const dbError = e as PostgrestError;
      error.value = dbError.message;
      return { success: false, error: dbError.message };
    } finally {
      loading.value = false;
    }
  }

  async function deleteMedia(id: string): Promise<MediaResponse> {
    loading.value = true;
    error.value = null;
    try {
      const { error: deleteError } = await db.deleteUserMedia(id);

      if (deleteError) throw deleteError;

      await fetchUserMedia();
      return { success: true };
    } catch (e) {
      const dbError = e as PostgrestError;
      error.value = dbError.message;
      return { success: false, error: dbError.message };
    } finally {
      loading.value = false;
    }
  }

  const getInProgressByType = computed(() => {
    return (type: MediaType) => {
      const items = userMedia.value.filter(
        (m) => m.media?.type === type && m.status === "in_progress"
      );

      // Сортируем по дате обновления (или создания) - самый свежий первый
      return items.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt).getTime();
        return dateB - dateA; // От новых к старым
      });
    };
  });

  return {
    userMedia,
    loading,
    error,
    stats,
    getMediaByType,
    getMediaByStatus,
    getInProgressByType,
    addMediaFromExternal,
    fetchUserMedia,
    addMedia,
    updateMedia,
    deleteMedia,
  };
});
