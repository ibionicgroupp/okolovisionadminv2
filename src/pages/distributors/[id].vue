<script setup lang="ts">
import DistributorForm from '@/components/distributors/DistributorForm.vue'
import axios from 'axios'
import { getAuth, onAuthStateChanged } from "firebase/auth"
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// definePage({ meta: { layout: 'default' } }) // ⬅️ Прибираємо public:true

definePage({
  name: 'distributor-details', // ✅ додаємо ім’я
  meta: {
    requiresAuth: true,
  },
})


const isAdmin = ref(false)
// definePage({ meta: { layout: 'default' } })

import { CLOUD_FUNCTIONS } from '@/utils/cloudFunctions'

const API_URL = CLOUD_FUNCTIONS.ADMIN_DISTRIBUTORS


const promoInput = ref()
const scannedList = ref<any[]>([])
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
const router = useRouter()
const record = ref<Distributor | null>(null)
const notFound = computed(() => !record.value)
const loading = ref(true)


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
      {action: "get", id: route.params.id},
      {headers: {Authorization: `Bearer ${token}`}}
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
    if (!u) {
      // користувач вилогінився
      record.value = null
      isAdmin.value = false
      return
    }

    // 🕒 затримка, щоб claims встигли оновитись після логіну
    await new Promise(res => setTimeout(res, 500))

    const t = await u.getIdTokenResult(true)
    const role = t.claims?.role
    const myId = t.claims?.distributorId
    isAdmin.value = role === 'admin'

    // 🔐 Безпечна перевірка — лише якщо route.id і myId вже відомі
    if (role === 'distributor' && route.params.id && route.params.id !== myId) {
      console.warn('❌ Спроба доступу до чужого дистриб’ютора', route.params.id, 'vs', myId)
      // alert('⛔ Доступ заборонено: ви не можете переглядати чужого дистриб’ютора.')
      // 👇 Використовуємо router.push, а не window.location (щоб не ламати Vue state)
      router.push(`/distributors/${myId}`)
      return
    }

    await loadDistributor()
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
  await axios.post(API_URL, {action: 'update', id: record.value.id, data: payload})
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
  const code = (promoCode.value ?? '').trim()
  if (!code) return

  searching.value = true

  try {
    const res = await axios.post(API_URL, {
      action: 'findPromocode',
      data: { code }
    })

    if (!res.data.success) {
      foundPromo.value = null
      snackbarText.value = res.data.message || 'Промокод не знайдено'
      snackbarColor.value = 'error'
      snackbar.value = true
      return
    }

    const promo = res.data.data
    foundPromo.value = promo

    // ДОДАЄМО в scannedList без дублювання
    if (!scannedList.value.find(p => p.id === promo.id)) {
      scannedList.value.push(promo)
    }

    // очищення поля + фокус назад
    promoCode.value = ''
    setTimeout(() => promoInput.value?.focus(), 50)

  } catch (e) {
    foundPromo.value = null
    snackbarText.value = 'Помилка при пошуку промокоду'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    searching.value = false
  }
}



//
// watch(promoDialog, (open) => {
//   if (open) {
//     setTimeout(() => promoInput.value?.focus(), 50)
//   }
// })


// 🕒 debounce watch
let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(promoCode, (newValue) => {
  const code = (newValue ?? '').trim()

  if (searchTimeout) clearTimeout(searchTimeout)

  // якщо поле порожнє — НЕ чіпаємо foundPromo
  if (!code) return

  searchTimeout = setTimeout(() => {
    searchPromo()
  }, 500)
})


watch(promoDialog, (open) => {
  if (open) {
    // відкривається модалка
    setTimeout(() => promoInput.value?.focus(), 50)
  } else {
    // закривається модалка
    promoCode.value = ''
    foundPromo.value = null
    searching.value = false
    scannedList.value = []
    if (searchTimeout) clearTimeout(searchTimeout)
  }
})


function onClearPromo() {
  // у Vuetify clear ставить null — явно приводимо до ''
  promoCode.value = ''
  foundPromo.value = null
  if (searchTimeout) clearTimeout(searchTimeout)
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
async function attachAllPromos() {
  if (!record.value) return

  try {
    for (const promo of scannedList.value) {
      await axios.post(API_URL, {
        action: 'attachPromocode',
        data: {
          distributorId: record.value.id,
          promocodeId: promo.id
        }
      })
    }

    snackbarText.value = 'Усі промокоди прикріплено'
    snackbarColor.value = 'success'
    snackbar.value = true

    scannedList.value = []
    promoDialog.value = false

    await loadDistributor()

  } catch (error) {
    console.error(error)
    snackbarText.value = 'Помилка при масовому додаванні'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}

function resetPromoDialog() {
  promoCode.value = ''
  foundPromo.value = null
  searching.value = false
  if (searchTimeout) clearTimeout(searchTimeout)
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
      data: {ids: record.value.promocodes}
    })
    promocodesList.value = res.data?.data || []
  } catch (e) {
    console.error(e)
    promocodesList.value = []
  } finally {
    loadingPromocodes.value = false
  }
}

const props = defineProps({
  record: Object
})
// const showPassword = ref(false)
//
// const maskedPassword = computed(() => {
//   const pwd = props.record?.password || ''
//   return '*'.repeat(pwd.length)
// })



function isActive(promo: any) {
  // якщо ще не активований
  if (!promo.isActivated || !promo.dateUsed) return false

  const start = new Date(promo.dateUsed).getTime()
  const months = promo.durationInMonths ?? 0

  // дата закінчення дії
  const end = new Date(start)
  end.setMonth(end.getMonth() + months)

  const now = Date.now()

  // промокод активний, якщо зараз до кінця строку дії
  return now < end.getTime()
}

const activeTab = ref('used') // Активний таб за замовчуванням — Використані
function onPromoRowClick(_: MouseEvent, row: any) {
  const userId = row?.item?.user?.id
  if (userId) {
    window.open(`/distributors/userStat?id=${userId}`, '_blank')
  }
}

const newPassword = ref("")

async function changePassword() {
  if (!newPassword.value) {
    alert("Введи новий пароль")
    return
  }

  try {
    const auth = getAuth()
    const u = auth.currentUser
    if (!u) {
      alert("Не авторизований")
      return
    }

    // 🔑 актуальний Firebase token
    const token = await u.getIdToken(true)

    const res = await axios.post(
      API_URL,
      {
        action: "adminSetDistributorPassword",
        id: record.value!.id,
        data: {
          password: newPassword.value,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!res.data.success) {
      alert(res.data.message)
      return
    }

    alert("Пароль успішно змінено")
    newPassword.value = ""

  } catch (e) {
    console.error(e)
    alert("Помилка зміни паролю")
  }
}


</script>

<template>
  <VContainer fluid>
    <!-- 🔹 Лоадер має бути ПЕРШИМ -->
    <div v-if="loading" class="d-flex justify-center py-6">
      <VProgressCircular indeterminate/>
    </div>

    <!-- 🔹 Основний контент -->
    <VCard
      v-else-if="!notFound"
      elevation="4"
      class="pa-4"
      style="border-radius: 12px;"
    >
      <!-- ====== HEADER / PROFILE INFO ====== -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center gap-4">
          <VAvatar size="60" color="primary" variant="tonal">
            <VIcon icon="tabler-user" size="36"/>
          </VAvatar>
          <div>
            <h2 class="mb-1">{{ record?.name }}</h2>
            <div class="text-medium-emphasis">
              {{ record?.type === 'clinic' ? 'Клініка' : 'Лікар' }} — {{ record?.city }}
            </div>
            <div class="text-medium-emphasis">
              <VIcon icon="tabler-phone" size="16" class="me-1"/>
              {{ record?.phone }}
            </div>
          </div>
        </div>

        <div class="d-flex gap-2" v-if="isAdmin">
          <VBtn color="primary" prepend-icon="tabler-ticket" @click="promoDialog = true"
                @after-leave="resetPromoDialog">
            Додати промокод
          </VBtn>
          <VBtn color="secondary" prepend-icon="tabler-edit" @click="edit = true">
            Редагувати
          </VBtn>
        </div>

      </div>

      <VDivider class="my-4"/>

      <!-- ====== LOGIN INFO ====== -->
      <VRow class="mb-4">
        <VCol cols="12" md="4">
          <div class="text-medium-emphasis mb-1">Логін</div>
          <div class="text-body-1 font-weight-medium">{{ record?.login }}</div>
        </VCol>
        <VCol cols="12" md="4">
          <div class="text-medium-emphasis mb-1">Пароль</div>

          <div class="d-flex">
            <v-text-field v-model="newPassword" />
            <v-btn @click="changePassword" class="ml-3">Змінити</v-btn>
          </div>

          <!--          <div class="d-flex align-center">-->
<!--            <template v-if="showPassword">-->
<!--              {{ record?.password }}-->
<!--            </template>-->
<!--            <template v-else>-->
<!--              ********-->
<!--            </template>-->
<!--            &lt;!&ndash;            <div class="text-body-1 font-weight-medium">&ndash;&gt;-->
<!--            &lt;!&ndash;              {{ showPassword ? record?.password : maskedPassword }}&ndash;&gt;-->
<!--            &lt;!&ndash;            </div>&ndash;&gt;-->

<!--            <v-btn-->
<!--              size="small"-->
<!--              variant="text"-->
<!--              class="ml-2"-->
<!--              @click="showPassword = !showPassword"-->
<!--            >-->
<!--              {{ showPassword ? 'Сховати' : 'Показати' }}-->
<!--            </v-btn>-->
<!--          </div>-->
        </VCol>

        <VCol cols="12" md="4">
          <div class="text-medium-emphasis mb-1">Дата створення</div>
          <div class="text-body-1 font-weight-medium">{{ formatDate(record?.createdAt) }}</div>
        </VCol>
      </VRow>

      <VDivider class="my-6"/>

      <!-- ====== PROMOCODES ====== -->
      <h3 class="mb-4">Прикріплені промокоди</h3>

      <VTabs v-model="activeTab" grow>
        <VTab value="used">
          <VIcon icon="tabler-check" class="me-2 text-success"/>
          Використані
        </VTab>

        <VTab value="unused">
          <VIcon icon="tabler-clock-pause" class="me-2 text-warning"/>
          Не використані
        </VTab>
      </VTabs>

      <VWindow v-model="activeTab" class="mt-4">
        <!-- 🔸 Використані -->
        <VWindowItem value="used">
          <VRow>
            <VCol cols="12">
              <VCard variant="flat" elevation="2" class="pa-2">
                <VCardTitle class="text-h6 d-flex align-center">
                  <VIcon icon="tabler-check" class="me-2 text-success"/>
                  Використані
                </VCardTitle>

                <VCardText>
                  <div v-if="loadingPromocodes" class="d-flex justify-center py-6">
                    <VProgressCircular indeterminate/>
                  </div>

                  <div v-else-if="!activePromos.length" class="text-medium-emphasis py-4">
                    Немає активованих промокодів
                  </div>

                  <VDataTable
                    v-else
                    :items="activePromos"
                    class="text-no-wrap"
                    density="comfortable"
                    :items-per-page="-1"
                    hover
                    height="420"
                  >
                    <template #headers>
                      <tr>
                        <th>#</th>
                        <th>Код</th>
                        <th>Статус</th>
                        <th>Дата активації</th>
                        <th>Користувач</th>
                        <th>Тривалість (міс)</th>
                        <th>Хв/день</th>
                        <th>Штрихкод</th>
                      </tr>
                    </template>

                    <template #item="{ item, index }">
                      <tr @click="onPromoRowClick($event, { item })" style="cursor:pointer">
                        <td>{{ index + 1 }}</td>
                        <td class="font-weight-medium">{{ item.code || item.barcode }}</td>
                        <td>
                          <VChip size="small" :color="isActive(item) ? 'success' : 'error'">
                            {{ isActive(item) ? 'Активний' : 'Не активний' }}
                          </VChip>
                        </td>
                        <td>{{ new Date(item.dateUsed).toLocaleDateString('uk-UA') }}</td>
                        <td>
      <span v-if="item.user" class="text-primary">
        {{ item.user.name || item.user.email || item.user.id }}
      </span>
                          <span v-else>—</span>
                        </td>
                        <td>{{ item.durationInMonths ?? '—' }}</td>
                        <td>{{ item.dailyPlayTimeMinutes ?? '—' }}</td>
                        <td>{{ item.barcode ?? '—' }}</td>
                      </tr>
                    </template>
                  </VDataTable>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VWindowItem>

        <!-- 🔹 Не використані -->
        <VWindowItem value="unused">
          <VRow>
            <VCol cols="12">
              <VCard variant="flat" elevation="2" class="pa-2">
                <VCardTitle class="text-h6 d-flex align-center">
                  <VIcon icon="tabler-clock-pause" class="me-2 text-warning"/>
                  Не використані
                </VCardTitle>

                <VCardText>
                  <div v-if="loadingPromocodes" class="d-flex justify-center py-6">
                    <VProgressCircular indeterminate/>
                  </div>

                  <div v-else-if="!inactivePromos.length" class="text-medium-emphasis py-4">
                    Немає неактивованих промокодів
                  </div>

                  <VDataTable
                    v-else
                    :items="inactivePromos"
                    class="text-no-wrap"
                    density="comfortable"
                    :items-per-page="-1"
                    height="420"
                  >
                    <template #headers>
                      <tr>
                        <th>#</th>
                        <th>Код</th>
                        <th>Тривалість (міс)</th>
                        <th>Хв/день</th>
                        <th>Штрихкод</th>
                      </tr>
                    </template>

                    <template #item="{ item, index }">
                      <tr>
                        <td>{{ index + 1 }}</td>
                        <td class="font-weight-medium">{{ item.code || item.barcode }}</td>
                        <td>{{ item.durationInMonths ?? '—' }}</td>
                        <td>{{ item.dailyPlayTimeMinutes ?? '—' }}</td>
                        <td>{{ item.barcode ?? '—' }}</td>

                      </tr>
                    </template>
                  </VDataTable>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VWindowItem>
      </VWindow>

      <!--      <VRow>-->
      <!--        &lt;!&ndash; 🔹 Не активовані &ndash;&gt;-->
      <!--        <VCol cols="12" md="5">-->
      <!--          <VCard variant="flat" elevation="2" class="pa-2">-->
      <!--            <VCardTitle class="text-h6 d-flex align-center">-->
      <!--              <VIcon icon="tabler-clock-pause" class="me-2 text-warning" />-->
      <!--              Не використані-->
      <!--            </VCardTitle>-->

      <!--            <VCardText>-->
      <!--              <div v-if="loadingPromocodes" class="d-flex justify-center py-6">-->
      <!--                <VProgressCircular indeterminate />-->
      <!--              </div>-->

      <!--              <div v-else-if="!inactivePromos.length" class="text-medium-emphasis py-4">-->
      <!--                Немає неактивованих промокодів-->
      <!--              </div>-->

      <!--              <VDataTable-->
      <!--                v-else-->
      <!--                :items="inactivePromos"-->
      <!--                class="text-no-wrap"-->
      <!--                density="comfortable"-->
      <!--                hide-default-footer-->
      <!--                height="420"-->
      <!--              >-->
      <!--                <template #headers>-->
      <!--                  <tr>-->
      <!--                    <th>Код</th>-->
      <!--                    <th>Тривалість (міс)</th>-->
      <!--                    <th>Хв/день</th>-->
      <!--                  </tr>-->
      <!--                </template>-->

      <!--                <template #item="{ item }">-->
      <!--                  <tr>-->
      <!--                    <td class="font-weight-medium">{{ item.code || item.barcode }}</td>-->
      <!--                    <td>{{ item.durationInMonths ?? '—' }}</td>-->
      <!--                    <td>{{ item.dailyPlayTimeMinutes ?? '—' }} </td>-->
      <!--                  </tr>-->
      <!--                </template>-->
      <!--              </VDataTable>-->
      <!--            </VCardText>-->
      <!--          </VCard>-->
      <!--        </VCol>-->

      <!--        &lt;!&ndash; 🔸 Активовані &ndash;&gt;-->
      <!--        <VCol cols="12" md="7">-->
      <!--          <VCard variant="flat" elevation="2" class="pa-2">-->
      <!--            <VCardTitle class="text-h6 d-flex align-center">-->
      <!--              <VIcon icon="tabler-check" class="me-2 text-success" />-->
      <!--              Використані-->
      <!--            </VCardTitle>-->

      <!--            <VCardText>-->
      <!--              <div v-if="loadingPromocodes" class="d-flex justify-center py-6">-->
      <!--                <VProgressCircular indeterminate />-->
      <!--              </div>-->

      <!--              <div v-else-if="!activePromos.length" class="text-medium-emphasis py-4">-->
      <!--                Немає активованих промокодів-->
      <!--              </div>-->

      <!--              <VDataTable-->
      <!--                v-else-->
      <!--                :items="activePromos"-->
      <!--                class="text-no-wrap"-->
      <!--                density="comfortable"-->
      <!--                hide-default-footer-->
      <!--                height="420"-->
      <!--              >-->
      <!--                <template #headers>-->
      <!--                  <tr>-->
      <!--                    <th>Код</th>-->
      <!--                    <th>Статус</th>-->
      <!--                    <th>Дата активації</th>-->
      <!--                    <th>Користувач</th>-->
      <!--                    <th>Тривалість (міс)</th>-->
      <!--                    <th>Хв/день</th>-->
      <!--                  </tr>-->
      <!--                </template>-->

      <!--                <template #item="{ item }">-->
      <!--                  <tr>-->
      <!--                    <td class="font-weight-medium">{{ item.code || item.barcode }}</td>-->
      <!--                    <td>-->

      <!--                      <VChip size="small" :color="isActive(item) ? 'success' : 'error'">-->
      <!--                        {{ isActive(item) ? 'Активний' : 'Не активний' }}-->
      <!--                      </VChip>-->

      <!--                    </td>-->
      <!--                    <td>{{ new Date(item.dateUsed).toLocaleDateString('uk-UA') }}</td>-->

      <!--                    <td>-->
      <!--                      <span v-if="item.user">-->
      <!--                        {{ item.user.name || item.user.email || item.user.id }}-->
      <!--                      </span>-->
      <!--                      <span v-else>—</span>-->
      <!--                    </td>-->
      <!--                    <td>{{ item.durationInMonths ?? '—' }}</td>-->
      <!--                    <td>{{ item.dailyPlayTimeMinutes ?? '—' }}</td>-->
      <!--                  </tr>-->
      <!--                </template>-->
      <!--              </VDataTable>-->
      <!--            </VCardText>-->
      <!--          </VCard>-->
      <!--        </VCol>-->
      <!--      </VRow>-->


    </VCard>

    <!-- 🔹 Повідомлення про відсутність -->
    <VAlert v-else type="warning" variant="tonal" class="my-6">
      Запис не знайдено
    </VAlert>


    <!-- Модалки -->
    <VDialog v-model="edit" max-width="640">
      <VCard>
        <VCardTitle>Редагувати</VCardTitle>
        <VCardText>
          <DistributorForm v-if="record" :initial="record" @submit="save"/>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog v-model="promoDialog" max-width="600">
      <VCard>
        <VCardTitle>Додати промокод</VCardTitle>
        <VCardText class="p-0">
          <VTextField
            ref="promoInput"
            label="Введіть промокод або штрихкод"
            v-model="promoCode"
            clearable
            @click:clear="onClearPromo"
            @keyup.enter="searchPromo"
          />
          <VBtn color="primary" class="mt-3" @click="searchPromo" :loading="searching">
            Знайти
          </VBtn>
          <!-- Список просканованих промокодів -->
          <div    v-if="scannedList.length">
            <h4 class="mb-2">Проскановані промокоди ({{ scannedList.length }}):</h4>

            <VAlert  type="info" class="mt-4"
                     v-for="p in scannedList"
              :key="p.id"


            >
              <div><b>Код:</b> {{ p.code }}</div>
              <div><b>Штрихкод:</b>     {{ p.barcode || '—' }}</div>
              <div><b>Тривалість:</b> {{ p.durationInMonths }} міс.</div>

              <div>
                <b>Активовано:</b>
                {{ p.isActivated ? 'Так' : 'Ні' }}
              </div>

              <div>
                <b>Дата створення:</b>
                {{ p.dateCreated ? new Date(p.dateCreated).toLocaleString() : '—' }}
              </div>

              <div>
                <b>Дата використання:</b>
                {{ p.dateUsed ? new Date(p.dateUsed).toLocaleString() : '—' }}
              </div>

<!--              <div>-->
<!--                <b>ID користувача:</b>-->
<!--                {{ p.usedByUserId || '—' }}-->
<!--              </div>-->

              <!-- 🔸 Використаний користувачем -->
              <VAlert
                v-if="p.user"
                type="info"
                density="compact"
                class="mt-2"
              >
                Використаний користувачем:
                <b>{{ p.user.name || p.user.email || p.user.id }}</b>
              </VAlert>

              <!-- 🔸 Уже доданий до іншого дистрибʼютора -->
              <VAlert
                v-else-if="p.attachedDistributor && p.attachedDistributor.id !== record?.id"
                type="warning"
                density="compact"
                class="mt-2"
              >
                Уже доданий до дистрибʼютора:
                <b>{{ p.attachedDistributor.name || p.attachedDistributor.login }}</b>
              </VAlert>

              <!-- 🟢 Доданий саме до цього дистрибʼютора -->
              <VAlert
                v-else-if="p.attachedDistributor && p.attachedDistributor.id === record?.id"
                type="success"
                density="compact"
                class="mt-2"
              >
                Доданий до цього дистрибʼютора
              </VAlert>
            </VAlert>

            <VBtn
              color="success"
              class="mt-4"
              @click="attachAllPromos"
              style="text-transform: inherit;"
            >
              Прикріпити всі ({{ scannedList.length }})
            </VBtn>
          </div>



          <!--          <VAlert v-if="foundPromo" type="info" class="mt-4">-->
<!--            <div><b>Код:</b> {{ foundPromo.code || foundPromo.barcode }}</div>-->
<!--            <div><b>Тривалість:</b> {{ foundPromo.durationInMonths }} міс.</div>-->
<!--            <div><b>Активовано:</b> {{ foundPromo.isActivated ? 'Так' : 'Ні' }}</div>-->
<!--            &lt;!&ndash;            {{foundPromo}}&ndash;&gt;-->
<!--            <div><b>Дата створення:</b> {{ new Date(foundPromo.dateCreated).toLocaleString() }}</div>-->
<!--            <div>-->
<!--              <b>Дата використання:</b>-->
<!--              {{ foundPromo?.dateUsed ? new Date(foundPromo.dateUsed).toLocaleString() : '—' }}-->
<!--            </div>-->

<!--            <div>-->
<!--              <b>ID користувач:</b>-->
<!--              {{ foundPromo?.usedByUserId || '—' }}-->
<!--            </div>-->
<!--&lt;!&ndash;            <VBtn color="success" class="mt-3" @click="attachPromo" style="    text-transform: inherit;">&ndash;&gt;-->
<!--&lt;!&ndash;              Прикріпити до дистриб’ютора&ndash;&gt;-->
<!--&lt;!&ndash;            </VBtn>&ndash;&gt;-->
<!--            <div v-if="foundPromo?.usedByUserId">-->
<!--              <VAlert type="warning" class="mt-3">-->
<!--                Промокод вже прикріплений до користувача-->
<!--              </VAlert>-->
<!--            </div>-->

<!--            <VBtn-->
<!--              v-else-->
<!--              color="success"-->
<!--              class="mt-3"-->
<!--              @click="attachPromo"-->
<!--              style="text-transform: inherit;"-->
<!--            >-->
<!--              Прикріпити до дистриб’ютора-->
<!--            </VBtn>-->
<!--          </VAlert>-->
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


