<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ChevronDown } from "lucide-vue-next";
import type { MediaType, MediaStatus, UserMedia } from "@/types";
import MediaListItem from "./MediaListItem.vue";

interface Props {
  title: string;
  items: UserMedia[];
  /**
   * Количество ВИДИМЫХ элементов с учётом фильтра.
   * Считается в родителе и передаётся сюда,
   * чтобы не дублировать логику фильтрации.
   */
  visibleCount: number;
  /**
   * Активный фильтр по типу медиа из родителя.
   * Передаётся в MediaListItem и применяется там через v-show.
   * Это ключевой prop для предотвращения перезагрузки обложек:
   * элементы скрываются, а не уничтожаются из DOM.
   */
  activeFilter: MediaType | "all";
  status: MediaStatus;
}

interface Emits {
  (e: "update-status", id: string, status: MediaStatus): void;
  (e: "delete-item", id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

/**
 * Секции с элементами открыты по умолчанию.
 * Пустые секции закрыты — не занимают место.
 */
const isOpen = ref(props.items.length > 0);
const sectionRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);
let observer: IntersectionObserver | null = null;
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting) {
        isVisible.value = true;
        observer?.disconnect();
      }
    },
    { threshold: 0.5, rootMargin: "100px" },
  );
  if (sectionRef.value) {
    observer.observe(sectionRef.value);
  }
});
onUnmounted(() => {
  observer?.disconnect();
});

const statusAccent = computed(() => {
  const map: Record<MediaStatus, { bar: string; badge: string; dot: string }> =
    {
      backlog: {
        bar: "bg-(--gray-300)",
        badge: "bg-(--gray-100) text-(--gray-600)",
        dot: "bg-(--gray-400)",
      },
      in_progress: {
        bar: "bg-(--primary-400)",
        badge: "bg-(--primary-50) text-(--primary-700)",
        dot: "bg-(--primary-500)",
      },
      completed: {
        bar: "bg-(--primary-600)",
        badge: "bg-(--primary-100) text-(--primary-800)",
        dot: "bg-(--primary-600)",
      },
      dropped: {
        bar: "bg-(--gray-200)",
        badge: "bg-(--gray-50) text-(--gray-500)",
        dot: "bg-(--gray-300)",
      },
    };
  return map[props.status];
});
</script>

<template>
  <!--
    Секция скрывается целиком (v-show) когда нет видимых элементов
    при активном фильтре — не занимает место в списке.
    Используем v-show, а не v-if, чтобы сохранить DOM внутри.
  -->
  <div
    ref="sectionRef"
    v-show="visibleCount > 0 || activeFilter === 'all'"
    class="rounded-2xl border border-(--border-color) bg-(--background-card) overflow-hidden transition-shadow duration-200 hover:shadow-(--shadow-sm)"
  >
    <!-- Заголовок-кнопка аккордеона -->
    <button
      @click="isOpen = !isOpen"
      class="w-full flex items-center justify-between px-5 py-4 cursor-pointer transition-colors duration-150 hover:bg-(--background-hover)"
    >
      <div class="flex items-center gap-3">
        <span
          class="w-2.5 h-2.5 rounded-full shrink-0"
          :class="statusAccent.dot"
        />
        <span class="text-base font-semibold text-(--text-primary)">
          {{ title }}
        </span>
        <!-- Бейдж показывает количество ВИДИМЫХ элементов (с учётом фильтра) -->
        <span
          v-if="visibleCount > 0"
          class="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-semibold"
          :class="statusAccent.badge"
        >
          {{ visibleCount }}
        </span>
      </div>

      <ChevronDown
        :size="18"
        :class="[
          'text-(--text-tertiary) transition-transform duration-250 ease-out shrink-0',
          isOpen ? 'rotate-180' : '',
        ]"
      />
    </button>

    <!-- Тонкая цветная линия под заголовком -->
    <div
      v-if="visibleCount > 0"
      class="h-px w-full"
      :class="statusAccent.bar"
    />

    <!-- Список с анимацией раскрытия -->
    <Transition name="accordion">
      <div v-if="isOpen && isVisible" class="overflow-hidden">
        <div
          v-for="(item, index) in items"
          :key="item.id"
          v-show="activeFilter === 'all' || item.media?.type === activeFilter"
          :class="{ 'border-t border-(--border-color-subtle)': index > 0 }"
        >
          <!--
            v-show на родительском div скрывает элемент без удаления из DOM.
            <img> внутри MediaListItem остаётся в памяти браузера —
            обложка не перезагружается при смене таба.
          -->
          <MediaListItem
            :item="item"
            :current-status="status"
            @update-status="(id, s) => emit('update-status', id, s)"
            @delete-item="(id) => emit('delete-item', id)"
          />
        </div>
      </div>
      <div v-else-if="isOpen && !isVisible" class="h-3" >
        <div class="w-full h-3" :class="statusAccent.bar" />

      </div>
    </Transition>
  </div>
</template>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition:
    max-height 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s ease;
  max-height: 2000px;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
