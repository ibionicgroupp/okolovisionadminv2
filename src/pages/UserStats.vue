<script setup lang="ts">
import { ref, onMounted } from "vue"
import axios from "axios"

const CF_ENDPOINT = "https://adminlistuserslitev2-956914206562.europe-west1.run.app"

const stats = ref({ total: 0, active: 0, inactive: 0, clinics: 0 })
const loadingStats = ref(false)

function isValid(user: any) {
  const end = user?.subscription?.subscriptionEndDate
  if (!end) return false
  const ts = new Date(end).getTime()
  return !isNaN(ts) && ts >= Date.now()
}

async function fetchStats() {
  loadingStats.value = true
  let pageToken = null
  let total = 0, active = 0, inactive = 0, clinics = 0

  try {
    do {
      const res = await axios.post(CF_ENDPOINT, { pageSize: 1000, pageToken })
      const data = res.data?.data || []

      data.forEach(u => {
        total++
        if (isValid(u)) active++
        else inactive++
        if (u.isClinic) clinics++
      })

      pageToken = res.data?.nextPageToken || null
    } while (pageToken)

    stats.value = { total, active, inactive, clinics }
  } catch (e) {
    console.error("Error fetching stats:", e)
  } finally {
    loadingStats.value = false
  }
}

onMounted(fetchStats)
</script>

<template>
  <VRow class="">
    <!-- Всього -->
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4 d-flex align-center">
        <VIcon icon="tabler-users" size="32" class="me-4 text-primary" />
        <div>
          <div class="text-h5 font-weight-bold">
            <template v-if="!loadingStats">{{ stats.total }}</template>
            <VProgressCircular v-else indeterminate size="20" width="2" />
          </div>
          <div class="text-caption">Всього користувачів</div>
        </div>
      </VCard>
    </VCol>

    <!-- Активні -->
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4 d-flex align-center">
        <VIcon icon="tabler-check" size="32" class="me-4 text-success" />
        <div>
          <div class="text-h5 font-weight-bold">
            <template v-if="!loadingStats">{{ stats.active }}</template>
            <VProgressCircular v-else indeterminate size="20" width="2" />
          </div>
          <div class="text-caption">Активні</div>
        </div>
      </VCard>
    </VCol>

    <!-- Неактивні -->
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4 d-flex align-center">
        <VIcon icon="tabler-x" size="32" class="me-4 text-error" />
        <div>
          <div class="text-h5 font-weight-bold">
            <template v-if="!loadingStats">{{ stats.inactive }}</template>
            <VProgressCircular v-else indeterminate size="20" width="2" />
          </div>
          <div class="text-caption">Неактивні</div>
        </div>
      </VCard>
    </VCol>

    <!-- Клініки -->
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4 d-flex align-center">
        <VIcon icon="tabler-building-hospital" size="32" class="me-4 text-info" />
        <div>
          <div class="text-h5 font-weight-bold">
            <template v-if="!loadingStats">{{ stats.clinics }}</template>
            <VProgressCircular v-else indeterminate size="20" width="2" />
          </div>
          <div class="text-caption">Клініки</div>
        </div>
      </VCard>
    </VCol>
  </VRow>
</template>
