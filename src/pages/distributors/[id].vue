<script setup lang="ts">
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import DistributorForm from '@/components/distributors/DistributorForm.vue'

// definePage({ meta: { layout: 'default' } }) // ⬅️ Прибираємо public:true

definePage({
  name: 'distributor-details', // ✅ додаємо ім’я
  meta: {
    requiresAuth: true,
  },
})


const isAdmin = ref(false)
// definePage({ meta: { layout: 'default' } })

const API_URL = "https://admindistributorsv2-956914206562.europe-west1.run.app"

// ===== Типи =====
type FirestoreTimestamp = { _seconds: number; _nanoseconds: number }

type Distributor = {
  id: string
  type: 'clinic' | 'doctor'
  name: string
  phone: string
  city: string
  login: string
  password: string
  createdAt?: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
  promocodes?: string[]
}

const route = useRoute()
const record = ref<Distributor | null>(null)
const notFound = computed(() => !record.value)
const loading = ref(false)

// ===== Завантаження дистриб’ютора =====
async function loadDistributor() {
  loading.value = true
  try {
    const auth = getAuth()
    const u = auth.currentUser
    if (!u) {
      record.value = null
      return
    }

    // ⬅️ важливо: true щоб підхопити актуальні claims
    const token = await u.getIdToken(true)

    const res = await axios.post(
      API_URL,
      { action: "get", id: route.params.id },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    record.value = res.data?.success ? res.data.data : null
  } catch (err) {
    console.error(err)
    record.value = null
  } finally {
    loading.value = false
    await loadPromocodesForDistributor()
  }
}
onMounted(() => {
  const auth = getAuth()
  onAuthStateChanged(auth, async (u) => {
    if (u) {
      // 🔹 Отримуємо claims (роль і distributorId)
      const t = await u.getIdTokenResult(true)
      const role = t.claims?.role
      const myId = t.claims?.distributorId
      isAdmin.value = role === 'admin'

      // 🔒 Якщо дистриб’ютор намагається зайти на чужий ID
      if (role === 'distributor' && route.params.id !== myId) {
        alert('⛔ Доступ заборонено: ви не можете переглядати чужого дистриб’ютора.')
        window.location.href = `/distributors/${myId}`
        return
      }

      // Завантажуємо свої дані
      await loadDistributor()
    } else {
      isAdmin.value = false
      record.value = null
    }
  })
})
// onMounted(loadDistributor)

// ===== Форматування дати =====
function formatDate(ts?: FirestoreTimestamp) {
  if (!ts?._seconds) return '—'
  const d = new Date(ts._seconds * 1000)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

// ===== Редагування =====
const edit = ref(false)
async function save(payload: Omit<Distributor, 'id'>) {
  if (!record.value) return
  await axios.post(API_URL, { action: 'update', id: record.value.id, data: payload })
  await loadDistributor()
  edit.value = false
}

// ===== Додавання промокоду =====
const promoDialog = ref(false)
const promoCode = ref('')
const foundPromo = ref<any | null>(null)
const searching = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

async function searchPromo() {
  if (!promoCode.value.trim()) return
  searching.value = true
  try {
    const res = await axios.post(API_URL, { action: 'findPromocode', data: { code: promoCode.value.trim() } })
    if (res.data.success) {
      foundPromo.value = res.data.data
    } else {
      foundPromo.value = null
      snackbarText.value = res.data.message || 'Промокод не знайдено'
      snackbarColor.value = 'error'
      snackbar.value = true
    }
  } catch (e) {
    snackbarText.value = 'Помилка при пошуку промокоду'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    searching.value = false
  }
}

async function attachPromo() {
  if (!record.value || !foundPromo.value) return
  try {
    await axios.post(API_URL, {
      action: 'attachPromocode',
      data: {
        distributorId: record.value.id,
        promocodeId: foundPromo.value.id
      }
    })
    snackbarText.value = 'Промокод прикріплено успішно'
    snackbarColor.value = 'success'
    snackbar.value = true
    promoDialog.value = false
    promoCode.value = ''
    foundPromo.value = null
    await loadDistributor()
  } catch (e) {
    snackbarText.value = 'Помилка при прикріпленні'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}


const inactivePromos = computed(() => promocodesList.value.filter(p => !p.dateUsed))
const activePromos = computed(() => promocodesList.value.filter(p => p.dateUsed))

const promocodesList = ref<any[]>([])
const loadingPromocodes = ref(false)

// Завантаження промокодів цього дистриб’ютора
async function loadPromocodesForDistributor() {
  if (!record.value?.promocodes?.length) {
    promocodesList.value = []
    return
  }
  loadingPromocodes.value = true
  try {
    const res = await axios.post(API_URL, {
      action: 'getPromocodesByIds',
      data: { ids: record.value.promocodes }
    })
    promocodesList.value = res.data?.data || []
  } catch (e) {
    console.error(e)
    promocodesList.value = []
  } finally {
    loadingPromocodes.value = false
  }
}


</script>

<template>
  <VContainer fluid>
    <VCard
      v-if="!notFound"
      elevation="4"
      class="pa-4"
      style="border-radius: 12px;"
    >
      <!-- ====== HEADER / PROFILE INFO ====== -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center gap-4">
          <VAvatar size="60" color="primary" variant="tonal">
            <VIcon icon="tabler-user" size="36" />
          </VAvatar>
          <div>
            <h2 class="mb-1">{{ record?.name }}</h2>
            <div class="text-medium-emphasis">
              {{ record?.type === 'clinic' ? 'Клініка' : 'Лікар' }} — {{ record?.city }}
            </div>
            <div class="text-medium-emphasis">
              <VIcon icon="tabler-phone" size="16" class="me-1" />
              {{ record?.phone }}
            </div>
          </div>
        </div>

        <div class="d-flex gap-2" v-if="isAdmin">
          <VBtn color="primary" prepend-icon="tabler-ticket" @click="promoDialog = true">
            Додати промокод
          </VBtn>
          <VBtn color="secondary" prepend-icon="tabler-edit" @click="edit = true">
            Редагувати
          </VBtn>
        </div>

      </div>

      <VDivider class="my-4" />

      <!-- ====== LOGIN INFO ====== -->
      <VRow class="mb-4">
        <VCol cols="12" md="4">
          <div class="text-medium-emphasis mb-1">Логін</div>
          <div class="text-body-1 font-weight-medium">{{ record?.login }}</div>
        </VCol>
        <VCol cols="12" md="4">
          <div class="text-medium-emphasis mb-1">Пароль</div>
          <div class="text-body-1 font-weight-medium">{{ record?.password }}</div>
        </VCol>
        <VCol cols="12" md="4">
          <div class="text-medium-emphasis mb-1">Дата створення</div>
          <div class="text-body-1 font-weight-medium">{{ formatDate(record?.createdAt) }}</div>
        </VCol>
      </VRow>

      <VDivider class="my-6" />

      <!-- ====== PROMOCODES ====== -->
      <h3 class="mb-4">Прикріплені промокоди</h3>

      <VRow>
        <!-- 🔹 Не активовані -->
        <VCol cols="12" md="6">
          <VCard variant="flat" elevation="2" class="pa-2">
            <VCardTitle class="text-h6 d-flex align-center">
              <VIcon icon="tabler-clock-pause" class="me-2 text-warning" />
              Не активовані
            </VCardTitle>

            <VCardText>
              <div v-if="loadingPromocodes" class="d-flex justify-center py-6">
                <VProgressCircular indeterminate />
              </div>

              <div v-else-if="!inactivePromos.length" class="text-medium-emphasis py-4">
                Немає неактивованих промокодів
              </div>

              <VDataTable
                v-else
                :items="inactivePromos"
                class="text-no-wrap"
                density="comfortable"
                hide-default-footer
                height="420"
              >
                <template #headers>
                  <tr>
                    <th>Код</th>
                    <th>Тривалість (міс)</th>
                    <th>Хв/день</th>
                  </tr>
                </template>

                <template #item="{ item }">
                  <tr>
                    <td class="font-weight-medium">{{ item.code || item.barcode }}</td>
                    <td>{{ item.durationInMonths ?? '—' }}</td>
                    <td>{{ item.dailyPlayTimeMinutes ?? '—' }}</td>
                  </tr>
                </template>
              </VDataTable>
            </VCardText>
          </VCard>
        </VCol>

        <!-- 🔸 Активовані -->
        <VCol cols="12" md="6">
          <VCard variant="flat" elevation="2" class="pa-2">
            <VCardTitle class="text-h6 d-flex align-center">
              <VIcon icon="tabler-check" class="me-2 text-success" />
              Активовані
            </VCardTitle>

            <VCardText>
              <div v-if="loadingPromocodes" class="d-flex justify-center py-6">
                <VProgressCircular indeterminate />
              </div>

              <div v-else-if="!activePromos.length" class="text-medium-emphasis py-4">
                Немає активованих промокодів
              </div>

              <VDataTable
                v-else
                :items="activePromos"
                class="text-no-wrap"
                density="comfortable"
                hide-default-footer
                height="420"
              >
                <template #headers>
                  <tr>
                    <th>Код</th>
                    <th>Дата активації</th>
                    <th>Користувач</th>
                    <th>Тривалість (міс)</th>
                    <th>Хв/день</th>
                  </tr>
                </template>

                <template #item="{ item }">
                  <tr>
                    <td class="font-weight-medium">{{ item.code || item.barcode }}</td>
                    <td>{{ new Date(item.dateUsed).toLocaleDateString('uk-UA') }}</td>
                    <td>
                      <span v-if="item.user">
                        {{ item.user.name || item.user.email || item.user.id }}
                      </span>
                      <span v-else>—</span>
                    </td>
                    <td>{{ item.durationInMonths ?? '—' }}</td>
                    <td>{{ item.dailyPlayTimeMinutes ?? '—' }}</td>
                  </tr>
                </template>
              </VDataTable>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCard>

    <VAlert v-else type="warning" variant="tonal" class="my-6">
      Запис не знайдено
    </VAlert>

    <!-- Модалки -->
    <VDialog v-model="edit" max-width="640">
      <VCard>
        <VCardTitle>Редагувати</VCardTitle>
        <VCardText>
          <DistributorForm v-if="record" :initial="record" @submit="save" />
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog v-model="promoDialog" max-width="600">
      <VCard>
        <VCardTitle>Додати промокод</VCardTitle>
        <VCardText class="p-0">
          <VTextField
            label="Введіть промокод або штрихкод"
            v-model="promoCode"
            clearable
            @keyup.enter="searchPromo"
          />
          <VBtn color="primary" class="mt-3" @click="searchPromo" :loading="searching">
            Знайти
          </VBtn>

          <VAlert v-if="foundPromo" type="info" class="mt-4">
            <div><b>Код:</b> {{ foundPromo.code || foundPromo.barcode }}</div>
            <div><b>Тривалість:</b> {{ foundPromo.durationInMonths }} міс.</div>
            <div><b>Активовано:</b> {{ foundPromo.isActivated ? 'Так' : 'Ні' }}</div>
            <div><b>Дата створення:</b> {{ new Date(foundPromo.dateCreated).toLocaleString() }}</div>
            <VBtn color="success" class="mt-3" @click="attachPromo">
              Прикріпити до дистриб’ютора
            </VBtn>
          </VAlert>
        </VCardText>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar" :color="snackbarColor" timeout="2500">
      {{ snackbarText }}
    </VSnackbar>
  </VContainer>
</template>
<style scoped>
h2 {
  font-weight: 600;
  letter-spacing: 0.2px;
}

.text-medium-emphasis {
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.VCardTitle {
  font-weight: 500;
}
</style>


