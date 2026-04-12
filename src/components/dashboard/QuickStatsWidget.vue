<script setup lang="ts">
import { computed } from "vue";
import { Trophy, TrendingUp, PlayCircle } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useMediaStore } from "@/stores/media";

interface CategoryStats {
  completed: number;
  total: number;
}

interface Props {
  booksStats: CategoryStats;
  moviesStats: CategoryStats;
  gamesStats: CategoryStats;
  thisWeekCompleted?: number;
}

const props = withDefaults(defineProps<Props>(), {
  thisWeekCompleted: 0,
});

const router = useRouter();
const authStore = useAuthStore();
const mediaStore = useMediaStore();
const userName = computed(() => {
  return authStore.userName || authStore.userEmail?.split("@")[0] || "Друг";
});

const totalCompleted = computed(
  () =>
    props.booksStats.completed +
    props.moviesStats.completed +
    props.gamesStats.completed
);

const totalInProgress = computed(
  () =>
    // props.booksStats.total -
    // props.booksStats.completed +
    // (props.moviesStats.total - props.moviesStats.completed) +
    // (props.gamesStats.total - props.gamesStats.completed)
    mediaStore.stats.movies.inProgress +
    mediaStore.stats.books.inProgress +
    mediaStore.stats.games.inProgress
);

function goToStats() {
  router.push("/stats");
}
</script>

<template>
  <div
    class="hero-stats-container mb-8 cursor-pointer hover:shadow-(--shadow-md) transition-all"
    @click="goToStats"
  >
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <!-- Left: Greeting -->
      <div class="shrink-0">
        <h2 class="text-2xl md:text-3xl font-bold text-(--text-primary)">
          Привет, {{ userName }}!
        </h2>
        <p class="text-sm text-(--text-tertiary) mt-1">
          Твой прогресс за неделю
        </p>
      </div>

      <!-- Right: Compact Stats Cards -->
      <div class="flex gap-3 flex-wrap md:flex-nowrap">
        <!-- Completed Card -->
        <div class="stat-compact-card">
          <div
            class="stat-compact-icon"
            style="background-color: var(--status-completed-bg)"
          >
            <Trophy :size="18" style="color: var(--status-completed-text)" />
          </div>
          <div class="stat-compact-content">
            <div class="stat-compact-value">{{ totalCompleted }}</div>
            <div class="stat-compact-label">завершено</div>
          </div>
        </div>

        <!-- In Progress Card -->
        <div class="stat-compact-card">
          <div
            class="stat-compact-icon"
            style="background-color: var(--status-progress-bg)"
          >
            <PlayCircle :size="18" style="color: var(--status-progress-text)" />
          </div>
          <div class="stat-compact-content">
            <div class="stat-compact-value">{{ totalInProgress }}</div>
            <div class="stat-compact-label">в процессе</div>
          </div>
        </div>

        <!-- This Week Card (if exists) -->
        <div v-if="thisWeekCompleted > 0" class="stat-compact-card stat-compact-card--highlight">
          <div
            class="stat-compact-icon"
            style="background-color: var(--primary-100)"
          >
            <TrendingUp :size="18" style="color: var(--primary-500)" />
          </div>
          <div class="stat-compact-content">
            <div class="stat-compact-value">+{{ thisWeekCompleted }}</div>
            <div class="stat-compact-label">за неделю</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-stats-container {
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--background-surface) 100%);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  padding: 1.5rem 2rem;
  box-shadow: var(--shadow-sm);
}

.stat-compact-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  min-width: 140px;
  background-color: var(--background-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}

.stat-compact-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-compact-card--highlight {
  border-color: var(--primary-300);
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--background-surface) 100%);
}

.stat-compact-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-compact-content {
  flex: 1;
  min-width: 0;
}

.stat-compact-value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-compact-label {
  font-size: 0.6875rem;
  color: var(--text-tertiary);
  margin-top: 0.125rem;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .hero-stats-container {
    padding: 1.25rem 1.5rem;
  }

  .stat-compact-card {
    min-width: 120px;
    padding: 0.75rem 0.875rem;
  }

  .stat-compact-value {
    font-size: 1.25rem;
  }

  .stat-compact-label {
    font-size: 0.625rem;
  }
}
</style>
