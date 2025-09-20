<script setup lang="ts">
import { ref, onMounted } from "vue"
import axios from "axios"

const CF_STATS_ENDPOINT = "https://adminusersstatsv2-956914206562.europe-west1.run.app"

const stats = ref({
  total: 0,
  ownUsers: 0,
  ownActive: 0,
  ownInactive: 0,
  clinics: 0,
  clinicUsers: 0
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
  <VRow>
    <!-- 1. Всього -->
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4 d-flex align-center">
        <VIcon icon="tabler-users" size="32" class="me-4 text-primary"/>
        <div>
          <div class="text-h5 font-weight-bold">
            <template v-if="!loadingStats">{{ stats.total }}</template>
            <VProgressCircular v-else indeterminate size="20" width="2"/>
          </div>
          <VTooltip text="Всі користувачі системи: власні, клініки та користувачі клінік">
            <template #activator="{ props }">
              <div class="text-caption" v-bind="props">Всього користувачів</div>
            </template>
          </VTooltip>
        </div>
      </VCard>
    </VCol>

    <!-- 2. Власні користувачі -->
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4">
        <div class="d-flex align-center mb-2">
          <VIcon icon="tabler-user" size="32" class="me-4 text-success"/>
          <div class="text-h6 font-weight-bold">Власні користувачі</div>
        </div>
        <div class="text-h5 font-weight-bold mb-1">
          {{ stats.ownUsers }}
        </div>
        <div class="text-caption">Активні: {{ stats.ownActive }}</div>
        <div class="text-caption">Неактивні: {{ stats.ownInactive }}</div>

        <VTooltip
          text="Користувачі, в яких isClinic == false/порожнє і немає clinicId.
Активні, якщо підписка (subscription.subscriptionEndDate) ще дійсна."
        >
          <template #activator="{ props }">
            <div class="text-caption mt-1 text-muted" v-bind="props">ℹ Як рахується</div>
          </template>
        </VTooltip>
      </VCard>
    </VCol>

    <!-- 3. Клініки -->
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4 d-flex align-center">
        <VIcon icon="tabler-building-hospital" size="32" class="me-4 text-info"/>
        <div>
          <div class="text-h5 font-weight-bold">
            {{ stats.clinics }}
          </div>
          <VTooltip text="Користувачі, в яких isClinic == true. Це власне акаунти клінік.">
            <template #activator="{ props }">
              <div class="text-caption" v-bind="props">Клініки</div>
            </template>
          </VTooltip>
        </div>
      </VCard>
    </VCol>

    <!-- 4. Користувачі клінік -->
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4 d-flex align-center">
        <VIcon icon="tabler-user-heart" size="32" class="me-4 text-warning"/>
        <div>
          <div class="text-h5 font-weight-bold">
            {{ stats.clinicUsers }}
          </div>
          <VTooltip
            text="Користувачі, які належать до клініки (мають clinicId).
Наприклад, якщо їх ID збережено у clinicPatients у клініки."
          >
            <template #activator="{ props }">
              <div class="text-caption" v-bind="props">Користувачі клінік</div>
            </template>
          </VTooltip>
        </div>
      </VCard>
    </VCol>
  </VRow>
</template>
