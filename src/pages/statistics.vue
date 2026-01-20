<script setup lang="ts">
import axios from 'axios'
import { ArcElement, BarElement, CategoryScale, Chart, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js'
import { computed, onMounted, ref } from 'vue'
import { Bar } from 'vue-chartjs'
import { CLOUD_FUNCTIONS } from '@/utils/cloudFunctions'

Chart.register(BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, ArcElement)

definePage({ meta: { layout: 'default' } })

// Cloud Function endpoint
const CF_STATISTICS = CLOUD_FUNCTIONS.ADMIN_STATISTICS

// Фільтри
const filters = ref({
  ageFrom: null,
  ageTo: null,
  gender: null,
  isActive: null,
  includeClinic: true,
})

// Дані
const loading = ref(false)
const statistics = ref<any>(null)
const errorMsg = ref('')

// Отримання статистики
async function fetchStatistics() {
  loading.value = true
  errorMsg.value = ''

  try {
    const response = await axios.post(CF_STATISTICS, { filters: filters.value })
    
    if (response.data?.success) {
      statistics.value = response.data.data
      console.log('📊 Statistics loaded:', statistics.value)
    } else {
      errorMsg.value = response.data?.message || 'Помилка отримання статистики'
    }
  } catch (error) {
    console.error('Error fetching statistics:', error)

    // @ts-ignore
    errorMsg.value = error?.response?.data?.message || 'Не вдалося завантажити статистику'
  } finally {
    loading.value = false
  }
}

// Дані для графіка розподілу по віку
const ageChartData = computed(() => {
  if (!statistics.value?.ageStats) return null

  const ages = statistics.value.ageStats.map((item) => item.age)
  const binocular = statistics.value.ageStats.map((item) => item.binocular)
  const monocular = statistics.value.ageStats.map((item) => item.monocular)

  return {
    labels: ages.map((age) => `${age} років`),
    datasets: [
      {
        label: 'Бінокуляр',
        data: binocular,
        backgroundColor: 'rgba(115, 103, 240, 0.7)',
        borderColor: 'rgba(115, 103, 240, 1)',
        borderWidth: 1,
      },
      {
        label: 'Монокуляр',
        data: monocular,
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  }
})

const ageChartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: 'Розподіл гравців по віку та режиму',
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
      },
    },
  },
}

// Дані для графіка популярності ігор (загальний)
const gamesTotalChartData = computed(() => {
  if (!statistics.value?.gameStats?.total) return null

  const games = statistics.value.gameStats.total.slice(0, 10)
  
  return {
    labels: games.map((game) => game.name || game.id),
    datasets: [
      {
        label: 'Кількість спроб',
        data: games.map((game) => game.attempts),
        backgroundColor: 'rgba(115, 103, 240, 0.7)',
        borderColor: 'rgba(115, 103, 240, 1)',
        borderWidth: 1,
      },
    ],
  }
})

// Дані для графіка популярності ігор (бінокуляр)
const gamesBinocularChartData = computed(() => {
  if (!statistics.value?.gameStats?.binocular) return null

  const games = statistics.value.gameStats.binocular.slice(0, 10)
  
  return {
    labels: games.map((game) => game.name || game.id),
    datasets: [
      {
        label: 'Кількість спроб (бінокуляр)',
        data: games.map((game) => game.attempts),
        backgroundColor: 'rgba(115, 103, 240, 0.7)',
        borderColor: 'rgba(115, 103, 240, 1)',
        borderWidth: 1,
      },
    ],
  }
})

// Дані для графіка популярності ігор (монокуляр)
const gamesMonocularChartData = computed(() => {
  if (!statistics.value?.gameStats?.monocular) return null

  const games = statistics.value.gameStats.monocular.slice(0, 10)
  
  return {
    labels: games.map((game) => game.name || game.id),
    datasets: [
      {
        label: 'Кількість спроб (монокуляр)',
        data: games.map((game) => game.attempts),
        backgroundColor: 'rgba(255, 159, 64, 0.7)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1,
      },
    ],
  }
})

const gamesChartOptions: any = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const game = statistics.value?.gameStats?.total?.find((g: any) => g.name === context.label) ||
                      statistics.value?.gameStats?.binocular?.find((g: any) => g.name === context.label) ||
                      statistics.value?.gameStats?.monocular?.find((g: any) => g.name === context.label)
          
          return `${context.parsed.y} спроб (${game?.percentage || 0}%)`
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        minRotation: 45,
        maxRotation: 45,
      },
    },
    y: {
      beginAtZero: true,
    },
  },
}

// Обробка зміни фільтрів
function applyFilters() {
  fetchStatistics()
}

function resetFilters() {
  filters.value = {
    ageFrom: null,
    ageTo: null,
    gender: null,
    isActive: null,
    includeClinic: true,
  }
  fetchStatistics()
}

onMounted(() => {
  fetchStatistics()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <span class="text-h6">Статистика</span>
        </VCardTitle>
        <VDivider />

        <VCardText>
          <!-- Фільтри -->
          <VCard variant="outlined" class="mb-6">
            <VCardTitle class="text-subtitle-1">Фільтри</VCardTitle>
            <VDivider />
            <VCardText>
              <VRow>
                <VCol cols="12" md="3">
                  <VTextField
                    v-model.number="filters.ageFrom"
                    label="Вік від"
                    type="number"
                    min="0"
                    variant="outlined"
                    density="compact"
                  />
                </VCol>
                <VCol cols="12" md="3">
                  <VTextField
                    v-model.number="filters.ageTo"
                    label="Вік до"
                    type="number"
                    min="0"
                    variant="outlined"
                    density="compact"
                  />
                </VCol>
                <VCol cols="12" md="3">
                  <VSelect
                    v-model="filters.gender"
                    label="Стать"
                    :items="[
                      { title: 'Всі', value: null },
                      { title: 'Чоловіча', value: 'Male' },
                      { title: 'Жіноча', value: 'Female' },
                      { title: 'Не вказано', value: 'Not specified' },
                    ]"
                    variant="outlined"
                    density="compact"
                  />
                </VCol>
                <VCol cols="12" md="3">
                  <VSelect
                    v-model="filters.isActive"
                    label="Активність"
                    :items="[
                      { title: 'Всі', value: null },
                      { title: 'Активні', value: true },
                      { title: 'Неактивні', value: false },
                    ]"
                    variant="outlined"
                    density="compact"
                  />
                </VCol>
                <VCol cols="12" md="3">
                  <VSwitch
                    v-model="filters.includeClinic"
                    label="Включити клініки"
                    color="primary"
                  />
                </VCol>
                <VCol cols="12" md="9" class="d-flex align-center gap-2">
                  <VBtn color="primary" @click="applyFilters">
                    Застосувати
                  </VBtn>
                  <VBtn variant="outlined" @click="resetFilters">
                    Скинути
                  </VBtn>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>

          <!-- Помилка -->
          <VAlert
            v-if="errorMsg"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ errorMsg }}
          </VAlert>

          <!-- Завантаження -->
          <div
            v-if="loading"
            class="d-flex justify-center py-8"
          >
            <VProgressCircular indeterminate />
          </div>

          <!-- Результати -->
          <template v-else-if="statistics">
            <!-- Загальна статистика -->
            <VRow class="mb-4">
              <VCol cols="12" md="3">
                <VCard variant="tonal" color="primary">
                  <VCardText>
                    <div class="text-caption text-medium-emphasis">
                      Всього користувачів
                    </div>
                    <div class="text-h4">
                      {{ statistics.totalUsers }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
              <VCol cols="12" md="3">
                <VCard variant="tonal" color="success">
                  <VCardText>
                    <div class="text-caption text-medium-emphasis">
                      Бінокуляр
                    </div>
                    <div class="text-h4">
                      {{ statistics.binocularStats?.binocular || 0 }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
              <VCol cols="12" md="3">
                <VCard variant="tonal" color="warning">
                  <VCardText>
                    <div class="text-caption text-medium-emphasis">
                      Монокуляр
                    </div>
                    <div class="text-h4">
                      {{ statistics.binocularStats?.monocular || 0 }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
              <VCol cols="12" md="3">
                <VCard variant="tonal" color="info">
                  <VCardText>
                    <div class="text-caption text-medium-emphasis">
                      Середній час на день
                    </div>
                    <div class="text-h4">
                      {{ Math.round(statistics.playTimeStats?.averagePerDay || 0) }} хв.
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>

            <!-- Графік розподілу по віку -->
            <VCard class="mb-6">
              <VCardTitle>Розподіл гравців по віку та режиму</VCardTitle>
              <VDivider />
              <VCardText>
                <div style="height: 400px">
                  <Bar
                    v-if="ageChartData"
                    :data="ageChartData"
                    :options="ageChartOptions"
                  />
                  <div
                    v-else
                    class="text-center py-8 text-medium-emphasis"
                  >
                    Немає даних для відображення
                  </div>
                </div>
              </VCardText>
            </VCard>

            <!-- Популярність ігор -->
            <VRow>
              <!-- Загальна популярність ігор -->
              <VCol cols="12" md="4">
                <VCard>
                  <VCardTitle class="text-subtitle-1">
                    Популярність ігор (загальна)
                  </VCardTitle>
                  <VDivider />
                  <VCardText>
                    <div style="height: 300px">
                      <Bar
                        v-if="gamesTotalChartData"
                        :data="gamesTotalChartData"
                        :options="gamesChartOptions"
                      />
                      <div
                        v-else
                        class="text-center py-8 text-medium-emphasis"
                      >
                        Немає даних
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <!-- Популярність ігор (бінокуляр) -->
              <VCol cols="12" md="4">
                <VCard>
                  <VCardTitle class="text-subtitle-1">
                    Популярність ігор (бінокуляр)
                  </VCardTitle>
                  <VDivider />
                  <VCardText>
                    <div style="height: 300px">
                      <Bar
                        v-if="gamesBinocularChartData"
                        :data="gamesBinocularChartData"
                        :options="gamesChartOptions"
                      />
                      <div
                        v-else
                        class="text-center py-8 text-medium-emphasis"
                      >
                        Немає даних
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <!-- Популярність ігор (монокуляр) -->
              <VCol cols="12" md="4">
                <VCard>
                  <VCardTitle class="text-subtitle-1">
                    Популярність ігор (монокуляр)
                  </VCardTitle>
                  <VDivider />
                  <VCardText>
                    <div style="height: 300px">
                      <Bar
                        v-if="gamesMonocularChartData"
                        :data="gamesMonocularChartData"
                        :options="gamesChartOptions"
                      />
                      <div
                        v-else
                        class="text-center py-8 text-medium-emphasis"
                      >
                        Немає даних
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>

            <!-- Детальна статистика по віку та іграх -->
            <VCard class="mt-6">
              <VCardTitle>Детальна статистика</VCardTitle>
              <VDivider />
              <VCardText>
                <div class="text-body-2 mb-4">
                  <strong>Визначення популярності ігор:</strong> Відсоток обчислюється від загальної кількості спроб усіх ігор.
                  Наприклад, якщо гра "Твістерс" має 100 спроб, а всього спроб по всіх іграх 1000, то відсоток = (100 / 1000) * 100 = 10%.
                </div>

                <!-- Список по віку -->
                <div
                  v-if="statistics.ageStats?.length"
                  class="mb-4"
                >
                  <div class="text-subtitle-2 mb-2">
                    Розподіл по віку:
                  </div>
                  <VRow>
                    <VCol
                      v-for="item in statistics.ageStats"
                      :key="item.age"
                      cols="12"
                      sm="6"
                      md="4"
                    >
                      <VChip
                        variant="outlined"
                        size="small"
                        class="mr-2"
                      >
                        {{ item.age }} років ({{ item.total }} гравців)
                      </VChip>
                      <VChip
                        color="success"
                        size="small"
                        class="mr-2"
                      >
                        Б: {{ item.binocular }}
                      </VChip>
                      <VChip
                        color="warning"
                        size="small"
                      >
                        М: {{ item.monocular }}
                      </VChip>
                    </VCol>
                  </VRow>
                </div>

                <!-- Топ ігор -->
                <div
                  v-if="statistics.gameStats?.total?.length"
                  class="mt-4"
                >
                  <div class="text-subtitle-2 mb-2">
                    Топ 10 ігор (загальна популярність):
                  </div>
                  <VList>
                    <VListItem
                      v-for="(game, index) in statistics.gameStats.total.slice(0, 10)"
                      :key="game.id"
                    >
                      <VListItemTitle>
                        {{ Number(index) + 1 }}. {{ game.name || game.id }}
                      </VListItemTitle>
                      <VListItemSubtitle>
                        {{ game.attempts }} спроб ({{ game.percentage }}%)
                      </VListItemSubtitle>
                    </VListItem>
                  </VList>
                </div>
              </VCardText>
            </VCard>

            <!-- Попередження про невідомі формати birthday -->
            <VAlert
              v-if="statistics.unknownBirthdayFormats?.length"
              type="warning"
              variant="tonal"
              class="mt-4"
            >
              <div class="text-subtitle-2 mb-2">
                Знайдено невідомі формати дати народження:
              </div>
              <div class="text-body-2">
                {{ statistics.unknownBirthdayFormats.join(', ') }}
              </div>
            </VAlert>
          </template>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
