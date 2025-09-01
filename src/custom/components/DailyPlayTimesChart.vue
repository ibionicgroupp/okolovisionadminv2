<template>
  <div class="w-full">
    <div class="d-flex align-center justify-space-between mb-2 gap-2">
      <button class="btn" @click="shiftMonths(-1)">Місяць назад</button>
      <div class="text-sm text-gray-600">{{ monthLabel }}</div>
      <button class="btn" @click="shiftMonths(1)" :disabled="disableNext">Місяць вперед</button>
    </div>

    <div style="height:300px">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js'
Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend)

const props = defineProps({
  // Приймаємо або об'єкт {'YYYY-MM-DD': number}, або JSON-рядок, або масив сесій (зведемо до об'єкта)
  times: { type: [Object, String, Array], required: true }
})

/* ========= Утиліти дат (UTC) ========= */
function dateKeyUTC(d) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const da = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${da}`
}
function parseKeyUTC(key) {
  const m = String(key).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
}
function firstDayOfMonthUTC(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}
function addMonthsUTC(d, n) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))
}
function daysInMonthUTC(monthStart) {
  return new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 0)).getUTCDate()
}
function labelMonthUk(monthStart) {
  return new Intl.DateTimeFormat('uk-UA', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(monthStart)
}
function labelDayUk(d) {
  return new Intl.DateTimeFormat('uk-UA', { timeZone: 'UTC', day: '2-digit', month: '2-digit' }).format(d) // dd.MM
}

/* ========= Нормалізація даних + сума за день ========= */
function safeJsonParse(str) {
  try {
    const cleaned = String(str).replace(/,\s*(?=[}\]])/g, '')
    return JSON.parse(cleaned)
  } catch { return {} }
}
function normalizeDateKey(x) {
  if (!x) return null
  if (x instanceof Date) return dateKeyUTC(x)
  const s = String(x).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const iso = new Date(s)
  if (!isNaN(iso)) return dateKeyUTC(iso)
  const m = s.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/) // DD-MM-YYYY, DD.MM.YYYY, DD/MM/YYYY
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return null
}
function buildDailyMap(input) {
  const map = {}
  if (!input) return map

  let src = input
  if (typeof src === 'string') src = safeJsonParse(src)

  if (!Array.isArray(src) && typeof src === 'object') {
    for (const [k, v] of Object.entries(src)) {
      const key = normalizeDateKey(k)
      if (key && !isNaN(+v)) map[key] = (map[key] ?? 0) + Number(v)
    }
    return map
  }

  if (Array.isArray(src)) {
    for (const item of src) {
      if (item == null) continue
      if (Array.isArray(item) && item.length >= 2) {
        const key = normalizeDateKey(item[0])
        const minutes = Number(item[1])
        if (key && !isNaN(minutes)) map[key] = (map[key] ?? 0) + minutes
        continue
      }
      if (typeof item === 'object') {
        const keys = Object.keys(item)
        if (keys.length === 1 && typeof item[keys[0]] !== 'object') {
          const key = normalizeDateKey(keys[0]); const minutes = Number(item[keys[0]])
          if (key && !isNaN(minutes)) map[key] = (map[key] ?? 0) + minutes
          continue
        }
        const dateLike = item.date ?? item.day ?? item.startedAt ?? item.start ?? item.timestamp
        const minutesLike = item.minutes ?? item.value ?? item.duration ?? item.time
        const key = normalizeDateKey(dateLike)
        const minutes = Number(minutesLike)
        if (key && !isNaN(minutes)) map[key] = (map[key] ?? 0) + minutes
      }
    }
  }
  return map
}
const timesMap = computed(() => buildDailyMap(props.times))

/* ========= Обмеження «вперед» (не далі за поточний місяць або останній день з даними) ========= */
const lastKey = computed(() => {
  const keys = Object.keys(timesMap.value || {}).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort()
  return keys.length ? keys[keys.length - 1] : null
})
const todayUTC = () => parseKeyUTC(dateKeyUTC(new Date()))
const endAnchorMonthStart = computed(() => {
  const todayMonth = firstDayOfMonthUTC(todayUTC())
  const last = lastKey.value ? firstDayOfMonthUTC(parseKeyUTC(lastKey.value)) : null
  if (!last) return todayMonth
  // беремо мінімум з (місяць сьогодні) і (останній місяць, де є дані)
  return last.getTime() > todayMonth.getTime() ? todayMonth : last
})

/* ========= Поточний місяць у вікні ========= */
const monthStart = ref(endAnchorMonthStart.value)
watch(endAnchorMonthStart, (ms) => { monthStart.value = ms })

function sameMonth(a, b) {
  return a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth()
}
function shiftMonths(n) {
  const next = addMonthsUTC(monthStart.value, n)
  // не дозволяємо йти у майбутнє (поза anchor)
  if (next.getTime() > endAnchorMonthStart.value.getTime()) return
  monthStart.value = next
}
const disableNext = computed(() => sameMonth(monthStart.value, endAnchorMonthStart.value))

const monthLabel = computed(() => labelMonthUk(monthStart.value))

/* ========= Дані для графіка ========= */
const chartData = computed(() => {
  const labels = []
  const data = []
  const days = daysInMonthUTC(monthStart.value)
  const y = monthStart.value.getUTCFullYear()
  const m = monthStart.value.getUTCMonth()

  for (let day = 1; day <= days; day++) {
    const d = new Date(Date.UTC(y, m, day))
    labels.push(labelDayUk(d))              // dd.MM
    const key = dateKeyUTC(d)
    const used = Number(timesMap.value?.[key] ?? 0)
    data.push(Math.round(used))             // ⬅️ округлення до цілого
  }
  return {
    labels,
    datasets: [{
      label: 'Хвилини за день',
      data,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: {ticks: {minRotation: 45, maxRotation: 45}},
    y: {
      beginAtZero: true,
      ticks: {
        // необов'язково: цілі поділки
        // stepSize: 1,
        callback: (v) => Math.round(v)
      }
    }
  },
  plugins: {
    legend: {display: false},
    tooltip: {callbacks: {label: (c) => ` ${Math.round(c.parsed.y)} хв.`}}
  }
}


</script>

<style scoped>
.btn {
  padding: 4px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
}

.btn:disabled {
  opacity: .5;
  cursor: not-allowed;
}
</style>
