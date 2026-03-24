import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { db, supabase } from "@/services/supabase";
import { mediaService } from "@/services/mediaService";
import type {
  UserMedia,
  MediaType,
  MediaStatus,
  DashboardStats,
  ExternalGame,
  ExternalMovie,
  ExternalBook,
} from "@/types";
import { useAuthStore } from "./auth";
import type {
  PostgrestError,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

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
  const subscriptionUserId = ref<string | null>(null);
  const userMediaChannel = ref<ReturnType<typeof supabase.channel> | null>(
    null,
  );
  const mutedEvents = ref<Record<string, number>>({});

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
        authStore.user.id,
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

  function getMuteKey(eventType: "INSERT" | "UPDATE" | "DELETE", id: string) {
    return `${eventType}:${id}`;
  }

  function muteRealtimeEvent(
    eventType: "INSERT" | "UPDATE" | "DELETE",
    id: string,
    ttlMs = 4000,
  ) {
    mutedEvents.value[getMuteKey(eventType, id)] = Date.now() + ttlMs;
  }

  function isRealtimeEventMuted(
    eventType: "INSERT" | "UPDATE" | "DELETE",
    id: string,
  ) {
    const key = getMuteKey(eventType, id);
    const mutedUntil = mutedEvents.value[key];
    if (mutedUntil === undefined) return false;
    if (mutedUntil < Date.now()) {
      delete mutedEvents.value[key];
      return false;
    }
    return true;
  }

  async function upsertUserMediaRecordById(recordId: string, userId: string) {
    const { data, error: fetchError } = await db.getUserMediaById(
      userId,
      recordId,
    );

    if (fetchError || !data) {
      if (fetchError) {
        console.error("Failed to fetch user_media by id:", fetchError.message);
      }
      return;
    }

    const index = userMedia.value.findIndex((item) => item.id === recordId);
    if (index === -1) {
      userMedia.value.unshift(data as UserMedia);
      return;
    }

    userMedia.value.splice(index, 1, data as UserMedia);
  }

  function removeUserMediaById(recordId: string) {
    const index = userMedia.value.findIndex((item) => item.id === recordId);
    if (index === -1) return;
    userMedia.value.splice(index, 1);
  }

  async function handleRealtimeChange(
    payload: RealtimePostgresChangesPayload<{ id: string; user_id: string }>,
  ) {
    const userId = authStore.user?.id;
    if (!userId) return;

    if (payload.eventType === "DELETE") {
      const deletedId = payload.old.id;
      if (!deletedId) return;
      if (isRealtimeEventMuted("DELETE", deletedId)) return;
      removeUserMediaById(deletedId);
      return;
    }

    const changedId = payload.new.id;
    if (!changedId) return;
    if (isRealtimeEventMuted(payload.eventType, changedId)) return;
    await upsertUserMediaRecordById(changedId, userId);
  }

  async function startUserMediaSubscription() {
    const userId = authStore.user?.id;
    if (!userId) return;

    if (userMediaChannel.value !== null && subscriptionUserId.value === userId) {
      return;
    }

    stopUserMediaSubscription();

    const channel = supabase.channel(`user-media:${userId}`);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_media",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        void handleRealtimeChange(
          payload as RealtimePostgresChangesPayload<{
            id: string;
            user_id: string;
          }>,
        );
      },
    );

    channel.subscribe();
    userMediaChannel.value = channel;
    subscriptionUserId.value = userId;
  }

  function stopUserMediaSubscription() {
    if (userMediaChannel.value !== null) {
      void userMediaChannel.value.unsubscribe();
      userMediaChannel.value = null;
    }
    subscriptionUserId.value = null;
    mutedEvents.value = {};
  }

  async function addMediaFromExternal(
    item: ExternalMovie | ExternalBook | ExternalGame,
    type: MediaType,
    status: MediaStatus = "backlog",
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
        const latestItemId = result.userMediaId;
        if (latestItemId) {
          muteRealtimeEvent("INSERT", latestItemId);
          await upsertUserMediaRecordById(latestItemId, authStore.user.id);
        } else {
          await fetchUserMedia();
        }
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
  // async function addMedia(
  //   mediaId: string,
  //   status: MediaStatus
  // ): Promise<MediaResponse> {
  //   if (!authStore.user)
  //     return { success: false, error: "User not authenticated" };

  //   loading.value = true;
  //   error.value = null;
  //   try {
  //     const { error: addError } = await db.addUserMedia({
  //       userId: authStore.user.id,
  //       mediaId,
  //       status,
  //       current_season: 1,
  //       current_episode: 1,
  //     });

  //     if (addError) throw addError;

  //     // Перезагружаем данные чтобы получить обновленный список
  //     await fetchUserMedia();
  //     return { success: true };
  //   } catch (e) {
  //     const dbError = e as PostgrestError;
  //     error.value = dbError.message;
  //     return { success: false, error: dbError.message };
  //   } finally {
  //     loading.value = false;
  //   }
  // }

  // Обновляет существующий медиа элемент (рейтинг, статус, отзыв и т.д.)
  async function updateMedia(
    id: string,
    updates: Partial<UserMedia>,
  ): Promise<MediaResponse> {
    error.value = null;
    const itemIndex = userMedia.value.findIndex((item) => item.id === id);

    let previousState: UserMedia | null = null;
    if (itemIndex !== -1) {
      previousState = { ...userMedia.value[itemIndex] };

      const updatedItem: UserMedia = {
        ...userMedia.value[itemIndex],
        ...updates,
      };
      userMedia.value.splice(itemIndex, 1, updatedItem);
    }
    try {
      const { error: updateError } = await db.updateUserMedia(id, updates);
      if (updateError) throw updateError;
      muteRealtimeEvent("UPDATE", id);

      return { success: true };
    } catch (e) {
      if (itemIndex !== -1 && previousState !== null) {
        userMedia.value.splice(itemIndex, 1, previousState);
      }
      const dbError = e as PostgrestError;
      error.value = dbError.message;
      return { success: false, error: dbError.message };
    }
  }
  // async function updateMedia(
  //   id: string,
  //   updates: Partial<UserMedia>,
  // ): Promise<MediaResponse> {
  //   loading.value = true;
  //   error.value = null;
  //   console.log("updateMedia updates", id, updates.watched_episodes);
  //   try {
  //     const { error: updateError } = await db.updateUserMedia(id, updates);

  //     if (updateError) throw updateError;

  //     await fetchUserMedia();
  //     return { success: true };
  //   } catch (e) {
  //     const dbError = e as PostgrestError;
  //     error.value = dbError.message;
  //     return { success: false, error: dbError.message };
  //   } finally {
  //     loading.value = false;
  //   }
  // }

  async function deleteMedia(id: string): Promise<MediaResponse> {
    loading.value = true;
    error.value = null;
    const itemIndex = userMedia.value.findIndex((item) => item.id === id);
    const deletedItem = itemIndex === -1 ? null : userMedia.value[itemIndex];

    if (itemIndex !== -1) {
      userMedia.value.splice(itemIndex, 1);
    }

    try {
      const { error: deleteError } = await db.deleteUserMedia(id);

      if (deleteError) throw deleteError;

      muteRealtimeEvent("DELETE", id);
      return { success: true };
    } catch (e) {
      if (deletedItem !== null && itemIndex !== -1) {
        userMedia.value.splice(itemIndex, 0, deletedItem);
      }
      const dbError = e as PostgrestError;
      error.value = dbError.message;
      return { success: false, error: dbError.message };
    } finally {
      loading.value = false;
    }
  }

  function clearUserMedia(): void {
    stopUserMediaSubscription();
    userMedia.value = [];
    error.value = null;
  }

  watch(
    () => authStore.user?.id,
    (userId, previousUserId) => {
      if (userId && userId !== previousUserId) {
        void startUserMediaSubscription();
        return;
      }

      if (!userId) {
        stopUserMediaSubscription();
      }
    },
    { immediate: true },
  );

  const getInProgressByType = computed(() => {
    return (type: MediaType) => {
      const items = userMedia.value.filter(
        (m) => m.media?.type === type && m.status === "in_progress",
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
    startUserMediaSubscription,
    stopUserMediaSubscription,
    //addMedia,
    updateMedia,
    deleteMedia,
    clearUserMedia,
  };
});
