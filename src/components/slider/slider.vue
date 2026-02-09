<script setup>
import { computed, watch, ref } from "vue";

const props = defineProps({
  modelValue: { type: Number, default: 50 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  label: { type: String, default: "Выберите значение" },
});

console.log('modelValue: ', props.modelValue)

const emit = defineEmits(["update:modelValue"]);

const value = computed({
  get: () => props.modelValue,
  set: (newValue) => emit("update:modelValue", Number(newValue)),
});

const progress = computed(() => {
  return ((value.value - props.min) / (props.max - props.min)) * 100;
});
// console.log("progress ", Math.round(progress.value));

// watch(props.model_value, (newValue) => {
//   console.log("watch model_value", newValue);
// });
// const updateValue = (event) => {
//   //console.log('slider input', event)
//   emit("update:modelValue", Number(event.target.value));
// };
</script>

<template>
  <div class="slider-container">
    <label v-if="label" class="slider-label">
      {{ label }}: <strong>{{ value }} / {{ max }}</strong>
    </label>
    <input
      type="range"
      v-model="value"
      :min="min"
      :max="max"
      :step="step"
      @input="updateValue"
    />
    <div class="w-full h-2 rounded-full bg-gray-400 overflow-hidden">
      <div
        class="h-full bg-green-400 rounded-full bg-primary-500 transition-all duration-300"
        :style="{
          width: `${Math.min(((value ?? 0) / max) * 100, 100)}%`,
        }"
      />
    </div>
    <p class="text-xs text-gray-400 mt-1 text-right">
      {{ Math.round(((value ?? 0) / max) * 100) }}%
    </p>
  </div>
</template>

<style scoped>
.slider-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 300px;
  font-family: sans-serif;
  background-color: aquamarine;
}

.slider-label {
  font-size: 14px;
  color: #333;
}

.custom-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 5px;
  background: linear-gradient(
    to right,
    #42b883 var(--progress),
    #e0e0e0 var(--progress)
  );
  outline: none;
  cursor: pointer;
}

.custom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  background: #42b883;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.1s ease;
}

.custom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.custom-slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: #42b883;
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
}
</style>
