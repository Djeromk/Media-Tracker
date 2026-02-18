<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from "vue";
import { Trophy, TrendingUp } from "lucide-vue-next";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

/**
 * Интерфейс для статистики по категориям
 */
interface CategoryStats {
  completed: number; // Завершено в этой категории
  total: number; // Всего в этой категории
}

/**
 * Props компонента
 */
interface Props {
  booksStats: CategoryStats; // Статистика по книгам
  moviesStats: CategoryStats; // Статистика по фильмам
  gamesStats: CategoryStats; // Статистика по играм
  thisWeekCompleted?: number; // Завершено на этой неделе
}

const props = withDefaults(defineProps<Props>(), {
  thisWeekCompleted: 0,
});

/**
 * Ref для контейнера ECharts
 */
const chartContainer = ref<HTMLElement | null>(null);

let chartInstance: echarts.ECharts | null = null;
const totalCompleted = computed(() => {
  return (
    props.booksStats.completed +
    props.moviesStats.completed +
    props.gamesStats.completed
  );
});
const totalItems = computed(() => {
  return (
    props.booksStats.total + props.moviesStats.total + props.gamesStats.total
  );
});

const completionPercentage = computed(() => {
  if (totalItems.value === 0) return 0;
  return Math.round((totalCompleted.value / totalItems.value) * 100);
});

const chartData = computed(() => {
  const data = [
    {
      value: props.booksStats.completed,
      name: "Книги",
      itemStyle: {
        color: "#0ab7f1d1", // Primary-500
      },
    },
    {
      value: props.moviesStats.completed,
      name: "Фильмы",
      itemStyle: {
        color: "#0a6ef1d4", // Primary-600
      },
    },
    {
      value: props.gamesStats.completed,
      name: "Игры",
      itemStyle: {
        color: "#6e35dfd4", // Primary-700
      },
    },
  ].filter((item) => item.value > 0); // Показываем только категории с завершенными элементами

  return data;
});

const getChartOption = (): EChartsOption => {
  return {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
      backgroundColor: "rgba(255, 255, 255, 0.96)",
      borderColor: "var(--border-color)",
      borderWidth: 1,
      textStyle: {
        color: "var(--text-primary)",
        fontSize: 12,
      },
      padding: [8, 12],
    },

    legend: {
      bottom: 50,
      left: "center",
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 16,
      textStyle: {
        fontSize: 11,
        color: "var(--text-tertiary)",
      },
      icon: "circle",
    },

    series: [
      {
        name: "Завершено",
        type: "pie",
        radius: ["50%", "75%"],
        center: ["50%", "42%"],
        data: chartData.value,

        itemStyle: {
          borderRadius: 8,
          borderColor: "#fff",
          borderWidth: 2,
        },
		startAngle: 180,
        endAngle: 360,

        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },

        emphasis: {
          scale: false,
          itemStyle: {
            shadowBlur: 12,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.2)",
          },
        },

        animationType: "scale",
        animationEasing: "elasticOut",
        animationDelay: function (idx: number) {
          return idx * 80;
        },
      },
    ],
  };
};


const initChart = () => {
  if (!chartContainer.value) return;

  chartInstance = echarts.init(chartContainer.value);
  chartInstance.setOption(getChartOption());

  window.addEventListener("resize", handleResize);
};

/**
 * Обновление графика при изменении данных
 */
const updateChart = () => {
  if (!chartInstance) return;
  chartInstance.setOption(getChartOption());
};

/**
 * Обработчик resize
 */
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

/**
 * Очистка ресурсов
 */
const cleanup = () => {
  if (chartInstance) {
    window.removeEventListener("resize", handleResize);
    chartInstance.dispose();
    chartInstance = null;
  }
};

// Lifecycle
onMounted(() => {
  initChart();
});

watch(
  () => [props.booksStats, props.moviesStats, props.gamesStats],
  () => {
    updateChart();
  },
  { deep: true }
);

onUnmounted(() => {
  cleanup();
});
</script>

<template>
  <div class="card-padded border-l-4 border-l-[var(--primary-500)]">
    <!-- Заголовок -->
    <div class="flex items-center gap-3">
      <div
        class="w-12 h-12 rounded-xl bg-[var(--primary-600)] flex items-center justify-center shadow-[var(--shadow-sm)]"
      >
        <Trophy :size="24" class="text-white" />
      </div>
      <div>
        <h3
          class="text-[var(--text-xl)] font-semibold text-[var(--text-primary)]"
        >
          Моя Активность
        </h3>
      </div>
    </div>

    <!-- Главная метрика - процент выполнения -->
    <div class="text-center items-start justify-between flex flex-row py-6 rounded-xl">
	 <div class="flex flex-col gap-2">
		<div class="text-[var(--text-sm)] text-[var(--text-tertiary)]">
		Ваш прогресс
	  </div>
      <div
        class="text-4xl font-extrabold text-[var(--primary-700)] leading-none"
      >
        {{ completionPercentage }}%
      </div>
	  </div>
      <!-- <div class="text-[var(--text-xs)] text-[var(--text-tertiary)]">
        {{ totalCompleted }} из {{ totalItems }} элементов
      </div> -->
	      <!-- Активность за неделю -->
		  <div
      v-if="thisWeekCompleted > 0"
      class="flex flex-col gap-2"
    >
      <div
        class="flex flex-col items-center justify-between p-3 rounded-lg outline-2 outline-(--gray-300)"
      >
        <div
          class="flex items-center gap-2 text-sm "
        >
          <TrendingUp :size="16" />
          <span class="font-medium">На этой неделе</span>
        </div>
        <div class="text-xl font-bold text-(--green-600)">
          +{{ thisWeekCompleted }}
        </div>
      </div>
    </div>
    </div>

    <!-- График распределения завершенных по категориям -->

    <div class="flex flex-row justify-between">
      <div v-if="totalCompleted > 0" class="w-fit">
        <h4
          class="text-sm font-semibold text-(--text-secondary)"
        >
          Распределение по категориям
        </h4>

        <!-- Контейнер для ECharts -->
        <div ref="chartContainer" class="w-full h-48"></div>
      </div>

      <!-- Детальная статистика по категориям -->
      <div class="flex flex-col gap-2">
        <!-- Книги -->
        <div
          class="flex items-center justify-between p-1 rounded-lg bg-[var(--background-subtle)]"
        >
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-[#3b82f6]"></div>
            <span class="text-[var(--text-sm)] text-[var(--text-secondary)]"
              >Книги</span
            >
          </div>
          <div class="text-right">
            <div
              class="text-[var(--text-base)] font-semibold text-[var(--text-primary)]"
            >
              {{ booksStats.completed }}
            </div>
            <div class="text-[var(--text-xs)] text-[var(--text-tertiary)]">
              из {{ booksStats.total }}
            </div>
          </div>
        </div>

        <!-- Фильмы -->
        <div
          class="flex items-center justify-between p-3 rounded-lg bg-[var(--background-subtle)]"
        >
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-[#2563eb]"></div>
            <span class="text-[var(--text-sm)] text-[var(--text-secondary)]"
              >Фильмы</span
            >
          </div>
          <div class="text-right">
            <div
              class="text-[var(--text-base)] font-semibold text-[var(--text-primary)]"
            >
              {{ moviesStats.completed }}
            </div>
            <div class="text-[var(--text-xs)] text-[var(--text-tertiary)]">
              из {{ moviesStats.total }}
            </div>
          </div>
        </div>

        <!-- Игры -->
        <div
          class="flex items-center justify-between p-3 rounded-lg bg-[var(--background-subtle)]"
        >
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-[#1d4ed8]"></div>
            <span class="text-[var(--text-sm)] text-[var(--text-secondary)]"
              >Игры</span
            >
          </div>
          <div class="text-right">
            <div
              class="text-[var(--text-base)] font-semibold text-[var(--text-primary)]"
            >
              {{ gamesStats.completed }}
            </div>
            <div class="text-[var(--text-xs)] text-[var(--text-tertiary)]">
              из {{ gamesStats.total }}
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Пустое состояние -->
    <div v-if="totalCompleted === 0" class="text-center py-8">
      <div
        class="w-16 h-16 mx-auto rounded-full bg-[var(--gray-100)] flex items-center justify-center"
      >
        <Trophy :size="24" class="text-[var(--gray-400)]" />
      </div>
      <p class="text-[var(--text-sm)] text-[var(--text-tertiary)]">
        Пока нет завершенных элементов
      </p>
    </div>
  </div>
</template>

<style scoped>
canvas {
  outline: none;
}
</style>
<!-- <script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { Activity, TrendingUp, Target } from "lucide-vue-next";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";

interface Props {
  totalItems: number;

  completedItems: number;

  inProgressItems: number;

  backlogItems: number;

  droppedItems?: number;

  thisWeekCompleted?: number;

}

const props = withDefaults(defineProps<Props>(), {
  droppedItems: 0,
  thisWeekCompleted: 0,
});

const chartContainer = ref<HTMLElement | null>(null);

let chartInstance: echarts.ECharts | null = null;

const completionPercentage = computed(() => {
  if (props.totalItems === 0) return 0;
  return Math.round((props.completedItems / props.totalItems) * 100);
});

const motivationMessage = computed(() => {
  const percentage = completionPercentage.value;

  if (percentage === 0) {
    return "Начните свой путь!";
  } else if (percentage < 25) {
    return "Отличное начало!";
  } else if (percentage < 50) {
    return "Продолжайте в том же духе!";
  } else if (percentage < 75) {
    return "Вы на полпути!";
  } else if (percentage < 100) {
    return "Почти у цели!";
  } else {
    return "Все задачи выполнены! 🎉";
  }
});

const chartData = computed(() => {
  return [
    {
      value: props.completedItems,
      name: "Завершено",
      itemStyle: {
        color: "#22c55e",

      },
    },
    {
      value: props.inProgressItems,
      name: "В процессе",
      itemStyle: {
        color: "#3b82f6",

      },
    },
    {
      value: props.backlogItems,
      name: "Бэклог",
      itemStyle: {
        color: "#f59e0b",

      },
    },
    {
      value: props.droppedItems,
      name: "Брошено",
      itemStyle: {
        color: "#ef4444",

      },
    },
  ].filter((item) => item.value > 0);

});

const getChartOption = (): EChartsOption => {
  return {

    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",

      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      textStyle: {
        color: "#1f2937",
        fontSize: 12,
      },
      padding: [8, 12],
    },

    legend: {
		orient: "vertical",
      bottom: 200,
      left: "right",
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 16,
      textStyle: {
        fontSize: 11,
        color: "#6b7280",
      },

      icon: "circle",
    },

    series: [
      {
        name: "Статистика",
        type: "pie",
		height: 300,

        radius: ["50%", "75%"],

        center: ["25%", "45%"],

        data: chartData.value,

        itemStyle: {

          borderRadius: 5,

          borderColor: "#fff",
          borderWidth: 1,
        },
        startAngle: 180,
        endAngle: 360,

        label: {
          show: false,
        },
        labelLine: {
          show: false,
        },

        emphasis: {

          scale: false,

        },

        animationType: "scale",
		animationEasing: 'backIn',

        animationDelay: function (idx: number) {

          return idx * 100;
        },
      },
    ],
  };
};

const initChart = () => {
  if (!chartContainer.value) return;

  chartInstance = echarts.init(chartContainer.value);

  chartInstance.setOption(getChartOption());

  window.addEventListener("resize", handleResize);
};

const updateChart = () => {
  if (!chartInstance) return;

  chartInstance.setOption(getChartOption());
};

const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

const cleanup = () => {
  if (chartInstance) {
    window.removeEventListener("resize", handleResize);
    chartInstance.dispose();
    chartInstance = null;
  }
};

onMounted(() => {

  initChart();
});

watch(
  () => [
    props.completedItems,
    props.inProgressItems,
    props.backlogItems,
    props.droppedItems,
  ],
  () => {
    updateChart();
  }
);

import { onUnmounted } from "vue";
onUnmounted(() => {
  cleanup();
});
</script>

<template>

  <div class="category-card border-l-4 border-l-(--primary-500)">

    <div class="flex items-center justify-between mb-4">

      <div class="flex items-center gap-3">
        <div
          class="icon-wrapper bg-gradient-to-br from-(--primary-400) to-(--primary-600) text-white"
        >
          <Activity :size="24" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">Активность</h3>
          <p class="text-xs text-[var(--text-tertiary)]">Общая статистика</p>
        </div>
      </div>
    </div>




    <div class="mb-4">

      <div class="flex items-center justify-between mb-2">
        <span
          class="text-sm text-[var(--text-secondary)] flex items-center gap-1"
        >
          <Target :size="14" />
          Распределение по статусам
        </span>
        <span class="text-4xl font-semibold text-[var(--text-primary)]">
          {{ completionPercentage }}%
        </span>
      </div>

      <div ref="chartContainer" class="w-full h-64 relative"></div>


      <p class="text-xs text-[var(--text-tertiary)] mt-2 italic text-center">
        {{ motivationMessage }}
      </p>
    </div>

    <div
      v-if="thisWeekCompleted > 0"
      class="mt-4 pt-4 border-t border-[var(--gray-200)]"
    >
      <div class="flex items-center justify-between">
        <div
          class="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
        >
          <TrendingUp :size="16" class="text-[var(--success-500)]" />
          <span>На этой неделе</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-lg font-bold text-[var(--success-600)]">
            +{{ thisWeekCompleted }}
          </span>
          <span class="text-xs text-[var(--text-tertiary)]"> завершено </span>
        </div>
      </div>
    </div>


    <div
      v-if="totalItems === 0"
      class="mt-4 p-3 rounded-lg bg-[var(--gray-50)] text-center"
    >
      <p class="text-sm text-[var(--text-secondary)]">
        Добавьте первый элемент, чтобы начать отслеживание
      </p>
    </div>
  </div>
</template>

<style scoped>

.category-card:hover .icon-wrapper {
  transform: scale(1.1);
  transition: transform var(--transition-base);
}

canvas {
  outline: none;
}
</style>
 -->
