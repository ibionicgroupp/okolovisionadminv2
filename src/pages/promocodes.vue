<script setup lang="ts">
import {ref, computed, onMounted, watch} from 'vue'
import axios from 'axios'

const CF_ENDPOINT_GET = 'https://us-central1-okolovision-48840.cloudfunctions.net/promocodeGetAll'
const CF_ENDPOINT_ADD = 'https://us-central1-okolovision-48840.cloudfunctions.net/promocodeAdd'

type Promo = {
  id: string
  code: string
  isActivated?: boolean
  dateCreated?: string | number | null
  dateUsed?: string | number | null
  usedByUserId?: string | null
  durationInMonths?: number | null
  dailyPlayTimeMinutes?: number | null
  _statusSort?: number
}


const promos = ref<Promo[]>([])
const stats = ref({total: 0, active: 0, inactive: 0, used: 0})
const loadingStats = ref(false)
const loadingTable = ref(false)
const errorMsg = ref('')

// пошук
const search = ref('')

// snackbar для копіювання
const copySnackbar = ref(false)
const copyText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

function showSnackbar(message: string, color: 'success' | 'error' = 'success') {
  copyText.value = message
  snackbarColor.value = color
  copySnackbar.value = true
}

// таблиця
const tablePage = ref(1)
const tableItemsPerPage = ref(20)
const sortBy = ref([{key: '_statusSort', order: 'desc'}])

// діалог додавання
const dialog = ref(false)
const newCodes = ref('')
const newMinutes = ref<number>(60)   // 🔹 за замовчуванням 60 хв
const newMonths = ref<number>(1)     // 🔹 за замовчуванням 1 місяць

watch(newCodes, (val) => {
  if (!val) return
  newCodes.value = val
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
})

function formatDate(val: any) {
  if (!val) return '—'
  const d = new Date(val)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('uk-UA')
}

function isActive(p: Promo) {
  return !p.isActivated
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
    } catch {
    }
    document.body.removeChild(ta)
  }
  copyText.value = 'Скопійовано'
  copySnackbar.value = true
}

const headers = [
  {title: 'Статус', key: '_statusSort', sortable: true, width: 130},
  {title: 'Код', key: 'code', sortable: true},
  {title: 'Дата створення', key: 'dateCreated', sortable: true, width: 160},
  {title: 'Використаний', key: 'dateUsed', sortable: true, width: 160},
  {title: 'ID користувача', key: 'usedByUserId', sortable: true, width: 220},
  {title: 'Тривалість (міс)', key: 'durationInMonths', sortable: true, width: 140},
  {title: 'Хв/день', key: 'dailyPlayTimeMinutes', sortable: true, width: 120},
]

const rowsFiltered = computed(() => {
  const q = String(search.value ?? '').trim().toLowerCase()
  if (!q) return promos.value
  return promos.value.filter(
    p =>
      String(p.code ?? '').toLowerCase().includes(q) ||
      String(p.usedByUserId ?? '').toLowerCase().includes(q)
  )
})

async function loadPromos() {
  loadingStats.value = true
  loadingTable.value = true
  errorMsg.value = ''
  try {
    const res = await axios.post(CF_ENDPOINT_GET, {})
    if (res.data.success) {
      promos.value = res.data.data.map((p: Promo) => ({
        ...p,
        _statusSort: isActive(p) ? 1 : 0,
      }))
      stats.value = res.data.stats
    } else {
      errorMsg.value = res.data.message || 'Помилка отримання промокодів'
    }
  } catch (e: any) {
    console.error(e)
    errorMsg.value = e?.message || 'Помилка отримання промокодів'
  } finally {
    loadingStats.value = false
    loadingTable.value = false
  }
}

async function addPromos() {
  try {
    // 🔹 валідація
    if (!newCodes.value.trim()) {
      showSnackbar("Введіть хоча б один промокод", "error")
      return
    }
    if (!newMinutes.value) {
      showSnackbar("Вкажіть хвилини на день", "error")
      return
    }
    if (!newMonths.value) {
      showSnackbar("Вкажіть тривалість у місяцях", "error")
      return
    }

    // 🔹 нормалізація + розбивка по пробілу
    const codes = newCodes.value
      .split(/\s+/)
      .map(c => c.toUpperCase().trim())
      .filter(Boolean)

    if (!codes.length) {
      showSnackbar("Невірний формат промокодів", "error")
      return
    }

    // 🔹 payload
    const payload = codes.map(code => ({
      code,
      dailyPlayTimeMinutes: newMinutes.value,
      durationInMonths: newMonths.value,
    }))

    const res = await axios.post(CF_ENDPOINT_ADD, {data: payload})

    if (!res.data.success) throw new Error(res.data.message || 'Помилка додавання')

    // 🔹 заміна твого copyText.value = ... на ось це
    const added = res.data.added ?? 0
    const updated = res.data.updated?.length ?? 0
    const skipped = res.data.skipped?.length ?? 0

    const msgParts: string[] = []
    if (added) msgParts.push(`Додано: ${added}`)
    if (updated) msgParts.push(`Оновлено: ${updated}`)
    if (skipped) msgParts.push(`Пропущено: ${skipped}`)

    const message = msgParts.length ? msgParts.join(', ') : 'Без змін'
    showSnackbar(message, 'success')

    // 🔹 очистка + закриття
    newCodes.value = ''
    newMinutes.value = 60     // дефолт
    newMonths.value = 1       // дефолт
    dialog.value = false

    await loadPromos?.()
  } catch (e: any) {
    showSnackbar(e.message || 'Помилка при додаванні', 'error')
  }
}


onMounted(loadPromos)
</script>

<template>
  <VRow>
    <!-- Метрики -->
    <VCol cols="12">
      <VRow>
        <VCol cols="3">
          <VCard class="pa-4 d-flex align-center">
            <VIcon icon="tabler-numbers" size="28" class="me-3 text-primary"/>
            <div>
              <div class="text-h6">
                <template v-if="!loadingStats">{{ stats.total }}</template>
                <VProgressCircular v-else indeterminate size="18" width="2"/>
              </div>
              <div class="text-caption">Всього</div>
            </div>
          </VCard>
        </VCol>
        <VCol cols="3">
          <VCard class="pa-4 d-flex align-center">
            <VIcon icon="tabler-check" size="28" class="me-3 text-success"/>
            <div>
              <div class="text-h6">
                <template v-if="!loadingStats">{{ stats.active }}</template>
                <VProgressCircular v-else indeterminate size="18" width="2"/>
              </div>
              <div class="text-caption">Активні</div>
            </div>
          </VCard>
        </VCol>
        <VCol cols="3">
          <VCard class="pa-4 d-flex align-center">
            <VIcon icon="tabler-x" size="28" class="me-3 text-error"/>
            <div>
              <div class="text-h6">
                <template v-if="!loadingStats">{{ stats.inactive }}</template>
                <VProgressCircular v-else indeterminate size="18" width="2"/>
              </div>
              <div class="text-caption">Неактивні</div>
            </div>
          </VCard>
        </VCol>
        <VCol cols="3">
          <VCard class="pa-4 d-flex align-center">
            <VIcon icon="tabler-user-check" size="28" class="me-3 text-info"/>
            <div>
              <div class="text-h6">
                <template v-if="!loadingStats">{{ stats.used }}</template>
                <VProgressCircular v-else indeterminate size="18" width="2"/>
              </div>
              <div class="text-caption">Використані</div>
            </div>
          </VCard>
        </VCol>
      </VRow>
    </VCol>

    <!-- Таблиця -->
    <VCol cols="12">
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between gap-3">
          <span class="text-h6">Промокоди</span>
          <VTextField
            v-model="search"
            density="comfortable"
            placeholder="Пошук (код або ID користувача)"
            clearable
            prepend-inner-icon="tabler-search"
            style="max-width: 300px"
            class="ms-auto"
          />

          <VBtn color="primary" prepend-icon="tabler-plus" @click="dialog = true">
            Додати промокоди
          </VBtn>
        </VCardTitle>


        <VDivider/>

        <VCardText>
          <div v-if="errorMsg" class="mb-4">
            <VAlert type="error" variant="tonal">{{ errorMsg }}</VAlert>
          </div>
          <div v-if="loadingTable" class="d-flex justify-center py-6">
            <VProgressCircular indeterminate/>
          </div>
          <div v-else>
            <VDataTable
              :headers="headers"
              :items="rowsFiltered"
              item-key="id"
              class="elevation-1 text-no-wrap"
              hover
              sticky
              height="600"
              v-model:page="tablePage"
              v-model:items-per-page="tableItemsPerPage"
              :items-length="rowsFiltered.length"
              v-model:sort-by="sortBy"
              :loading="loadingTable"
            >
              <!-- Статус -->
              <template #item._statusSort="{ item }">
                <VChip size="small" :color="isActive(item) ? 'success' : 'error'">
                  {{ isActive(item) ? 'Активний' : 'Не активний' }}
                </VChip>
              </template>

              <!-- Код -->
              <template #item.code="{ item }">
                <div class="d-flex align-center gap-x-2">
                  <code>{{ item.code }}</code>
                  <VBtn size="x-small" icon variant="text" @click="copy(item.code)">
                    <VIcon icon="tabler-copy" size="16"/>
                  </VBtn>
                </div>
              </template>

              <!-- Дата створення -->
              <template #item.dateCreated="{ item }">
                {{ formatDate(item.dateCreated) }}
              </template>

              <!-- Використаний -->
              <template #item.dateUsed="{ item }">
                {{ item.dateUsed ? formatDate(item.dateUsed) : '—' }}
              </template>

              <!-- ID користувача -->
              <template #item.usedByUserId="{ item }">
                <div class="d-flex align-center gap-x-2">
                  <span>{{ item.usedByUserId || '—' }}</span>
                  <VBtn
                    v-if="item.usedByUserId"
                    size="x-small"
                    icon
                    variant="text"
                    @click="copy(item.usedByUserId)"
                  >
                    <VIcon icon="tabler-copy" size="16"/>
                  </VBtn>
                </div>
              </template>

              <!-- Тривалість -->
              <template #item.durationInMonths="{ item }">
                {{ item.durationInMonths ?? '—' }}
              </template>

              <!-- Хв/день -->
              <template #item.dailyPlayTimeMinutes="{ item }">
                {{ item.dailyPlayTimeMinutes ?? '—' }}
              </template>
            </VDataTable>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Діалог додавання -->
  <!-- діалог -->
  <VDialog v-model="dialog" max-width="600">
    <DialogCloseBtn @click="dialog = !dialog"/>
    <VCard title="Додати промокоди">
      <VCardText>
        <VRow>
          <VCol cols="12">
            <VTextField
              v-model="newMinutes"
              type="number"
              label="Хвилин на день"
              placeholder="60"
            />
          </VCol>
          <VCol cols="12">

            <VTextField
              v-model="newMonths"
              type="number"
              label="Тривалість (місяці)"
              placeholder="3"
            />
          </VCol>
          <VCol cols="12">
            <VTextarea
              v-model="newCodes"
              label="Промокоди"
              placeholder="ABC123 DEF456 GHI789"
              auto-grow
            />
          </VCol>

        </VRow>

      </VCardText>

      <VCardText class="d-flex justify-end flex-wrap gap-3 pt-5 overflow-visible">
        <VBtn
          @click="dialog = false"
          type="reset"

          variant="tonal"
          color="error"
        >
          Відмінити
        </VBtn>
        <VBtn
          variant="flat"
          color="primary"
          @click="addPromos">
          Додати
        </VBtn>
      </VCardText>
    </VCard>


  </VDialog>

  <!-- Snackbar -->
  <VSnackbar v-model="copySnackbar" timeout="1600" location="top" :color="snackbarColor">
    {{ copyText }}
  </VSnackbar>
</template>
