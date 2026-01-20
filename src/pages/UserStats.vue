<script setup lang="ts">
import axios from "axios"
import { onMounted, ref } from "vue"

import { CLOUD_FUNCTIONS } from '@/utils/cloudFunctions'

const CF_STATS_ENDPOINT = CLOUD_FUNCTIONS.ADMIN_USERS_STATS

const stats = ref({
  total: 0,
  ownUsers: 0,
  ownActive: 0,
  ownInactive: 0,
  clinics: 0,
  clinicUsers: 0,
})

const loadingStats = ref(false)

async function fetchStats() {
  loadingStats.value = true
  try {
    const res = await axios.post(CF_STATS_ENDPOINT, {})
    if (res.data.success) {
      stats.value = res.data
    }
  } catch (e) {
    console.error("Error fetching stats:", e)
  } finally {
    loadingStats.value = false
  }
}

onMounted(fetchStats)
</script>

<template>
  <VRow align="stretch">
    <!-- 1. Всього -->
    <VCol
      cols="12"
      sm="6"
      md="3"
    >
      <VCard
        v-if="loadingStats"
        class="pa-4 h-100 d-flex align-center justify-center"
      >
        <VProgressCircular
          indeterminate
          size="32"
          width="3"
        />
      </VCard>
      <VCard
        v-else
        class="pa-4 h-100"
      >
        <div class="d-flex align-center mb-2">
          <VIcon
            icon="tabler-users"
            size="32"
            class="me-4 text-primary"
          />
          <VTooltip text="Всі користувачі системи: власні, клініки та користувачі клінік">
            <template #activator="{ props }">
              <div
                class="text-h6 font-weight-bold"
                v-bind="props"
              >
                Всього користувачів
              </div>
            </template>
          </VTooltip>
        </div>
        <div class="text-h5 font-weight-bold">
          {{ stats.total }}
        </div>
      </VCard>
    </VCol>

    <!-- 2. Власні користувачі -->
    <VCol
      cols="12"
      sm="6"
      md="3"
    >
      <VCard
        v-if="loadingStats"
        class="pa-4 h-100 d-flex align-center justify-center"
      >
        <VProgressCircular
          indeterminate
          size="32"
          width="3"
        />
      </VCard>
      <VCard
        v-else
        class="pa-4 h-100"
      >
        <div class="d-flex align-center mb-2">
          <VIcon
            icon="tabler-user"
            size="32"
            class="me-4 text-success"
          />
          <VTooltip
            text="Користувачі, в яких isClinic == false/порожнє і немає clinicId.
Активні, якщо subscription.subscriptionEndDate ще дійсна."
          >
            <template #activator="{ props }">
              <div
                class="text-h6 font-weight-bold"
                v-bind="props"
              >
                Власні користувачі
              </div>
            </template>
          </VTooltip>
        </div>
        <div class="d-flex align-center justify-space-between">
          <div class="text-h5 font-weight-bold mb-1">
            {{ stats.ownUsers }}
          </div>
          <div class="d-flex">
            <div class="text-caption mr-4 ">
              Активні: <span class="text-success"> {{ stats.ownActive }}</span>
            </div>
            <div class="text-caption">
              Неактивні: <span class="text-error">{{ stats.ownInactive }}</span>
            </div>
          </div>
        </div>
      </VCard>
    </VCol>

    <!-- 3. Клініки -->
    <VCol
      cols="12"
      sm="6"
      md="3"
    >
      <VCard
        v-if="loadingStats"
        class="pa-4 h-100 d-flex align-center justify-center"
      >
        <VProgressCircular
          indeterminate
          size="32"
          width="3"
        />
      </VCard>
      <VCard
        v-else
        class="pa-4 h-100"
      >
        <div class="d-flex align-center mb-2">
          <VIcon
            icon="tabler-building-hospital"
            size="32"
            class="me-4 text-info"
          />
          <VTooltip
            text="Користувачі, в яких isClinic == true (акаунти клінік).
Активні, якщо підписка ще дійсна."
          >
            <template #activator="{ props }">
              <div
                class="text-h6 font-weight-bold"
                v-bind="props"
              >
                Клініки
              </div>
            </template>
          </VTooltip>
        </div>
        <div class="d-flex align-center justify-space-between">
          <div class="text-h5 font-weight-bold mb-1">
            {{ stats.clinics }}
          </div>
          <div class="text-caption">
            Активні:  <span class="text-success"> {{ stats.activeClinics }}</span>
          </div>
        </div>
      </VCard>
    </VCol>

    <!-- 4. Користувачі клінік -->
    <VCol
      cols="12"
      sm="6"
      md="3"
    >
      <VCard
        v-if="loadingStats"
        class="pa-4 h-100 d-flex align-center justify-center"
      >
        <VProgressCircular
          indeterminate
          size="32"
          width="3"
        />
      </VCard>
      <VCard
        v-else
        class="pa-4 h-100"
      >
        <div class="d-flex align-center mb-2">
          <VIcon
            icon="tabler-user-heart"
            size="32"
            class="me-4 text-warning"
          />
          <VTooltip text="Користувачі, які належать до клініки (мають clinicId, звʼязані з clinicPatients).">
            <template #activator="{ props }">
              <div
                class="text-h6 font-weight-bold"
                v-bind="props"
              >
                Користувачі клінік
              </div>
            </template>
          </VTooltip>
        </div>
        <div class="text-h5 font-weight-bold mb-1">
          {{ stats.clinicUsers }}
        </div>
      </VCard>
    </VCol>
  </VRow>
</template>



