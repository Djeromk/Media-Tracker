<script setup lang="ts">
import { computed } from 'vue'
import { Activity, TrendingUp, Target } from 'lucide-vue-next'

/**
 * Интерфейс для пропсов компонента ActivityCard
 */
interface Props {
  totalItems: number          // Общее количество элементов
  completedItems: number      // Завершенные элементы
  inProgressItems: number     // В процессе
  thisWeekCompleted?: number  // Завершено на этой неделе (опционально)
}

const props = withDefaults(defineProps<Props>(), {
  thisWeekCompleted: 0
})

/**
 * Вычисляемый процент завершения
 * Формула: (завершенные / общие) * 100
 * Если общих нет, возвращаем 0 чтобы избежать деления на 0
 */
const completionPercentage = computed(() => {
  if (props.totalItems === 0) return 0
  return Math.round((props.completedItems / props.totalItems) * 100)
})

/**
 * Текст для мотивационного сообщения в зависимости от прогресса
 */
const motivationMessage = computed(() => {
  const percentage = completionPercentage.value

  if (percentage === 0) {
    return 'Начните свой путь!'
  } else if (percentage < 25) {
    return 'Отличное начало!'
  } else if (percentage < 50) {
    return 'Продолжайте в том же духе!'
  } else if (percentage < 75) {
    return 'Вы на полпути!'
  } else if (percentage < 100) {
    return 'Почти у цели!'
  } else {
    return 'Все задачи выполнены! 🎉'
  }
})

/**
 * Цвет прогресс-бара в зависимости от процента
 * 0-30% - красноватый (мало)
 * 30-70% - оранжевый/желтый (средне)
 * 70-100% - зеленый (отлично)
 */
const progressColor = computed(() => {
  const percentage = completionPercentage.value

  if (percentage < 30) {
    return 'from-[var(--error-400)] to-[var(--error-600)]'
  } else if (percentage < 70) {
    return 'from-[var(--warning-400)] to-[var(--warning-600)]'
  } else {
    return 'from-[var(--success-400)] to-[var(--success-600)]'
  }
})
</script>

<template>
  <!--
    Карточка активности - показывает общую статистику пользователя
    Использует класс category-card для консистентности с другими карточками
    Добавлен градиентный бордер для выделения
  -->
  <div class="category-card border-l-4 border-l-(--primary-500) hover:bg-(--primary-50)">

    <!-- Заголовок карточки -->
    <div class="flex items-center justify-between mb-4">
      <!-- Иконка и название -->
      <div class="flex items-center gap-3">
        <div class="icon-wrapper bg-linear-to-br from-(--primary-400) to-(--primary-600) text-white">
          <Activity :size="24" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">Активность</h3>
          <p class="text-xs text-(--text-tertiary)">Общая статистика</p>
        </div>
      </div>
    </div>

    <!-- Главная статистика - крупные цифры -->
    <div class="grid grid-cols-3 gap-3 mb-4">

      <!-- Всего элементов -->
      <div class="text-center p-3 rounded-lg bg-(--gray-50)">
        <div class="text-2xl font-bold text-(--text-primary)">
          {{ totalItems }}
        </div>
        <div class="text-xs text-(--text-tertiary) mt-1">
          Всего
        </div>
      </div>

      <!-- В процессе -->
      <div class="text-center p-3 rounded-lg bg-(--info-50)">
        <div class="text-2xl font-bold text-(--info-600)">
          {{ inProgressItems }}
        </div>
        <div class="text-xs text-(--info-600) mt-1">
          В работе
        </div>
      </div>

      <!-- Завершено -->
      <div class="text-center p-3 rounded-lg bg-(--success-50)">
        <div class="text-2xl font-bold text-(--success-600)">
          {{ completedItems }}
        </div>
        <div class="text-xs text-(--success-600) mt-1">
          Готово
        </div>
      </div>
    </div>

    <!-- Прогресс-бар с процентами -->
    <div class="mb-4">
      <!-- Заголовок прогресса -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-(--text-secondary) flex items-center gap-1">
          <Target :size="14" />
          Общий прогресс
        </span>
        <span class="text-sm font-semibold text-(--text-primary)">
          {{ completionPercentage }}%
        </span>
      </div>

      <!--
        Прогресс-бар
        Высота увеличена до h-3 для лучшей видимости
        Градиент меняется в зависимости от процента выполнения
      -->
      <div class="progress h-3">
        <div
          class="h-full bg-linear-to-r rounded-full transition-all duration-(--transition-slow)"
          :class="progressColor"
          :style="{ width: `${completionPercentage}%` }"
        ></div>
      </div>

      <!-- Мотивационное сообщение -->
      <p class="text-xs text-(--text-tertiary) mt-2 italic">
        {{ motivationMessage }}
      </p>
    </div>

    <!-- Активность за неделю (если есть данные) -->
    <div
      v-if="thisWeekCompleted > 0"
      class="mt-4 pt-4 border-t border-(--gray-200)"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm text-(--text-secondary)">
          <TrendingUp :size="16" class="text-(--success-500)" />
          <span>На этой неделе</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-lg font-bold text-(--success-600)">
            +{{ thisWeekCompleted }}
          </span>
          <span class="text-xs text-(--text-tertiary)">
            завершено
          </span>
        </div>
      </div>
    </div>

    <!-- Подсказка если нет элементов -->
    <div
      v-if="totalItems === 0"
      class="mt-4 p-3 rounded-lg bg-(--gray-50) text-center"
    >
      <p class="text-sm text-(--text-secondary)">
        Добавьте первый элемент, чтобы начать отслеживание
      </p>
    </div>
  </div>
</template>

<style scoped>
/**
 * Дополнительные стили для анимации прогресс-бара
 * Плавное изменение ширины при обновлении данных
 */
.progress div {
  transition: width var(--transition-slow);
}

/**
 * Добавляем небольшую анимацию при наведении на всю карточку
 * Подсветка для привлечения внимания
 */
.category-card:hover .icon-wrapper {
  transform: scale(1.1);
  transition: transform var(--transition-base);
}
</style>
