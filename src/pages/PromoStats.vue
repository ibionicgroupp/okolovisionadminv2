<!--<script setup lang="ts">-->
<!--import { ref, onMounted } from "vue"-->
<!--import axios from "axios"-->

<!--const CF_ENDPOINT = "https://us-central1-okolovision-48840.cloudfunctions.net/promocodeGetAll"-->

<!--const stats = ref({ total: 0, active: 0, inactive: 0, used: 0 })-->
<!--const loadingStats = ref(false)-->

<!--function isActive(p: any) {-->
<!--  // за твоєю логікою: якщо isActivated = true → вже використаний-->
<!--  return !p.isActivated-->
<!--}-->

<!--async function fetchStats() {-->
<!--  loadingStats.value = true-->
<!--  try {-->
<!--    const res = await axios.post(CF_ENDPOINT, {})-->
<!--    const data = res.data?.data || []-->

<!--    let total = 0, active = 0, inactive = 0, used = 0-->

<!--    data.forEach((p: any) => {-->
<!--      total++-->
<!--      if (isActive(p)) active++-->
<!--      else inactive++-->
<!--      if (p.usedByUserId) used++-->
<!--    })-->

<!--    stats.value = { total, active, inactive, used }-->
<!--  } catch (e) {-->
<!--    console.error("Error fetching promo stats:", e)-->
<!--  } finally {-->
<!--    loadingStats.value = false-->
<!--  }-->
<!--}-->

<!--onMounted(fetchStats)-->
<!--</script>-->

<!--<template>-->
<!--  <VRow>-->
<!--    <VCol cols="12" sm="6" md="3">-->
<!--      <VCard class="pa-4 d-flex align-center">-->
<!--        <VIcon icon="tabler-ticket" size="32" class="me-4 text-primary" />-->
<!--        <div>-->
<!--          <div class="text-h5 font-weight-bold">-->
<!--            <template v-if="!loadingStats">{{ stats.total }}</template>-->
<!--            <VProgressCircular v-else indeterminate size="20" width="2" />-->
<!--          </div>-->
<!--          <div class="text-caption">Всього промокодів</div>-->
<!--        </div>-->
<!--      </VCard>-->
<!--    </VCol>-->

<!--    <VCol cols="12" sm="6" md="3">-->
<!--      <VCard class="pa-4 d-flex align-center">-->
<!--        <VIcon icon="tabler-check" size="32" class="me-4 text-success" />-->
<!--        <div>-->
<!--          <div class="text-h5 font-weight-bold">-->
<!--            <template v-if="!loadingStats">{{ stats.active }}</template>-->
<!--            <VProgressCircular v-else indeterminate size="20" width="2" />-->
<!--          </div>-->
<!--          <div class="text-caption">Активні</div>-->
<!--        </div>-->
<!--      </VCard>-->
<!--    </VCol>-->

<!--    <VCol cols="12" sm="6" md="3">-->
<!--      <VCard class="pa-4 d-flex align-center">-->
<!--        <VIcon icon="tabler-x" size="32" class="me-4 text-error" />-->
<!--        <div>-->
<!--          <div class="text-h5 font-weight-bold">-->
<!--            <template v-if="!loadingStats">{{ stats.inactive }}</template>-->
<!--            <VProgressCircular v-else indeterminate size="20" width="2" />-->
<!--          </div>-->
<!--          <div class="text-caption">Неактивні</div>-->
<!--        </div>-->
<!--      </VCard>-->
<!--    </VCol>-->

<!--    <VCol cols="12" sm="6" md="3">-->
<!--      <VCard class="pa-4 d-flex align-center">-->
<!--        <VIcon icon="tabler-user-check" size="32" class="me-4 text-info" />-->
<!--        <div>-->
<!--          <div class="text-h5 font-weight-bold">-->
<!--            <template v-if="!loadingStats">{{ stats.used }}</template>-->
<!--            <VProgressCircular v-else indeterminate size="20" width="2" />-->
<!--          </div>-->
<!--          <div class="text-caption">Використані</div>-->
<!--        </div>-->
<!--      </VCard>-->
<!--    </VCol>-->
<!--  </VRow>-->
<!--</template>-->
