<script setup lang="ts">
import {ref, onMounted} from "vue"
import axios from "axios"

// 🔗 нова функція для статистики
const CF_STATS_ENDPOINT = "https://adminusersstatsv2-956914206562.europe-west1.run.app"

const stats = ref({total: 0, active: 0, inactive: 0, clinics: 0})
const loadingStats = ref(false)

async function fetchStats() {
  loadingStats.value = true
  try {
    const res = await axios.post(CF_STATS_ENDPOINT, {})
    const d = res.data
    if (d.success) {
      stats.value = {
        total: d.total,
        active: d.active,
        inactive: d.inactive,
        clinics: d.clinics,
      }
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
    <!-- Всього -->
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4 d-flex align-center">
        <VIcon icon="tabler-users" size="32" class="me-4 text-primary"/>
        <div>
          <div class="text-h5 font-weight-bold">


            <template v-if="!loadingStats">{{ stats.total }}</template>
            <VProgressCircular v-else indeterminate size="20" width="2"/>

          </div>
          <VTooltip text="Клініки та користувачі які самі зареєструвались, без користувачів клініки">
            <template #activator="{ props }">
              <div class="text-caption" v-bind="props">Всього користувачів</div>
            </template>
          </VTooltip>
        </div>
      </VCard>
    </VCol>

    <!-- Активні -->
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4 d-flex align-center">
        <VIcon icon="tabler-check" size="32" class="me-4 text-success"/>
        <div>
          <div class="text-h5 font-weight-bold">
            <template v-if="!loadingStats">{{ stats.active }}</template>
            <VProgressCircular v-else indeterminate size="20" width="2"/>
          </div>
          <VTooltip text="Користувачі, які активні та дата підписки не вичерпана">
            <template #activator="{ props }">
              <div class="text-caption" v-bind="props">Активні</div>
            </template>
          </VTooltip>
        </div>
      </VCard>
    </VCol>

    <!-- Неактивні -->
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4 d-flex align-center">
        <VIcon icon="tabler-x" size="32" class="me-4 text-error"/>
        <div>
          <div class="text-h5 font-weight-bold">
            <template v-if="!loadingStats">{{ stats.inactive }}</template>
            <VProgressCircular v-else indeterminate size="20" width="2"/>
          </div>

          <VTooltip text="Користувачі, які неактивні та дата підписки вичерпана">
            <template #activator="{ props }">
              <div class="text-caption" v-bind="props">Неактивні</div>
            </template>
          </VTooltip>
        </div>
      </VCard>
    </VCol>

    <!-- Клініки -->
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4 d-flex align-center">
        <VIcon icon="tabler-building-hospital" size="32" class="me-4 text-info"/>
        <div>
          <div class="text-h5 font-weight-bold">
            <template v-if="!loadingStats">{{ stats.clinics }}</template>
            <VProgressCircular v-else indeterminate size="20" width="2"/>
          </div>
          <VTooltip text="Клініки">
            <template #activator="{ props }">
              <div class="text-caption" v-bind="props">Клініки</div>
            </template>
          </VTooltip>
        </div>
      </VCard>
    </VCol>
  </VRow>
</template>
