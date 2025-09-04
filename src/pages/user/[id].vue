<script setup lang="ts">
import {ref, onMounted, computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import axios from 'axios'
import themeUser from '@images/pages/user-profile-header-bg.png'

// CF-ендпоінт
const CF_ENDPOINT = 'https://us-central1-okolovision-48840.cloudfunctions.net/userGetData'
const CF_UPDATE_PROFILE = 'https://us-central1-okolovision-48840.cloudfunctions.net/userUpdateProfile'

definePage({meta: {layout: 'default'}})

// ТВОЇ компоненти
import DailyPlayTimesChart from '@/custom/components/DailyPlayTimesChart.vue'
import ClinicUsersTable from '@/custom/components/ClinicUsersTable.vue'

const route = useRoute()
const router = useRouter()

type UserData = any
const user = ref<UserData | null>(null)
const loading = ref(false)
const errorMsg = ref('')

// snackbar
const copySnackbar = ref(false)
const copyText = ref('')

// helpers
function toDate(v: any) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDT(v: any) {
  const d = toDate(v);
  if (!d) return '—'
  return d.toLocaleDateString('uk-UA') + ' ' + d.toLocaleTimeString('uk-UA', {hour: '2-digit', minute: '2-digit'})
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x
}

function parseSubDate(v: any) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'number') return new Date(v)
  const s = String(v).trim()
  if (/^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/.test(s)) {
    const d = new Date(s);
    return isNaN(d as any) ? null : d
  }
  const m = s.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1])
  return null
}

function isActive(u: any) {
  return u?.subscription?.isActive === true
}

function isValidDateOff(u: any) {
  const end = parseSubDate(u?.subscription?.subscriptionEndDate)
  return !!end && startOfDay(end).getTime() >= startOfDay(new Date()).getTime()
}

function isValid(u: any) {
  return isActive(u) && isValidDateOff(u)
}

function isBinocular(u: any) {
  const v = u?.settings?.IsBinocularMode ?? u?.settings?.isBinocularMode ?? u?.settings?.binocularMode ?? u?.settings?.BinocularMode
  return v === true || v === 1 || v === '1' || v === 'true' || v === 'True'
}

function isClinic(u: any) {
  const v = u?.isClinic ?? u?.IsClinic ?? u?.clinic;
  return v === true || v === 1 || v === '1' || v === 'true' || v === 'True'
}

function kyivKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())
  const y = parts.find(p => p.type === 'year')?.value, m = parts.find(p => p.type === 'month')?.value,
    d = parts.find(p => p.type === 'day')?.value
  return `${y}-${m}-${d}`
}

function usedMinutesToday(u: any) {
  const t = u?.subscription?.dailyPlayTimes ?? u?.dailyPlayTimes ?? {}
  return Math.round(Number(t?.[kyivKey()] ?? 0))
}

const fullName = computed(() => user.value ? `${user.value.firstName ?? ''} ${user.value.lastName ?? ''}`.trim() || '—' : '—')

// fetch
async function fetchUser() {
  loading.value = true;
  errorMsg.value = ''
  try {
    const id = route.params.id as string
    const res = await axios.post(CF_ENDPOINT, {userId: id})
    user.value = res.data?.data ?? null
  } catch (e: any) {
    console.error(e);
    errorMsg.value = e?.response?.data?.message || 'Не вдалося завантажити користувача'
  } finally {
    loading.value = false
  }
}

const gameNames: Record<string, string> = {
  "a727cd04-7f77-47a0-86c8-38e57e11f84b": "Дорога тварин",
  "6d24ce1e-1017-48a3-b6f6-082979e2aaba": "Космічна куля",
  "39615c8e-4575-4d45-adc9-8aa04de879ac": "Хрестики",
  "cbb292d7-68a3-41f2-b20b-487d20c9153f": "Тандем",
  "4f5dd55a-bd2f-4fc6-b44d-6d66cfaba210": "Полювання на качок",
  "905096b1-af85-4f8e-acaf-7671627ad20d": "Фузія гоу +",
  "65917f06-8102-4a45-8f0f-67d64e043564": "Фузія гоу -",
  "d6a28af8-cf9c-4069-ab99-93df2131e89d": "Фузія гоу",
  "a086ab0b-384b-4e97-8b06-fd841890e89a": "Фузія Дуо",
  "2c22657b-5a2a-4b26-891f-d178a8825e75": "Автомагістраль +",
  "a330cdaf-e25d-4595-9c85-6d7f8d8adb3a": "Автомагістраль -",
  "245a4077-e116-4348-939b-23f21f8763ca": "Вище хмар",
  "c7894e9a-a734-41bc-8d4c-90df35942130": "Магічні фрукти",
  "9b50f940-5679-4fd8-a58b-3f6809343428": "Пазли",
  "2a9419f0-b096-427a-9be3-295de05f50da": "Маріо",
  "9386aaf0-27c0-4ccb-a08f-fa6e01d6cc16": "Формоленд",
  "e3d606be-89df-4090-8246-676ceba47098": "Павучок",
  "5739dd72-a73f-4d5c-a96a-3a9034d33a4f": "Тетріс",
  "fd5bcdea-8aa8-4938-8c65-8c7d0cddfd86": "Твістерс",
}

const gamesList = computed(() => {
  if (!user.value?.gameRecords) return []
  return Object.entries(user.value.gameRecords)
    .map(([gameId, rec]: any) => ({
      id: gameId,
      name: gameNames[gameId] ?? gameId,
      attempts: rec.attempts ?? 0,
      sessions: rec.sessions ?? 0,
      successfulAttempts: rec.successfulAttempts ?? 0,
      totalPoints: rec.totalPoints ?? 0,
      correctColorRecord: rec.correctColorRecord ?? {},
    }))
    .sort((a, b) => b.attempts - a.attempts) // 🔹 спочатку ті, в кого більше спроб
})


onMounted(fetchUser)

// CF endpoint для оновлення isClinic
const CF_UPDATE_CLINIC = 'https://us-central1-okolovision-48840.cloudfunctions.net/userUpdateIsClinic'

async function toggleClinic(e: Event) {
  if (!user.value) return

  const target = e.target as HTMLInputElement
  const newValue = target.checked

  try {
    await axios.post(CF_UPDATE_CLINIC, {
      userId: user.value.id,   // ⚠️ тут перевір чи у тебе поле `id` чи `uid`
      isClinic: newValue,
    })

    // локально оновлюємо
    user.value.isClinic = newValue
    copyText.value = 'isClinic успішно оновлено'
    copySnackbar.value = true
  } catch (err: any) {
    console.error('Помилка при оновленні isClinic', err)
    console.error('Помилка при оновленні isClinic', err)
    copyText.value = 'Помилка при оновленні'
    copySnackbar.value = true
  }
}

function formatDateTime(v: any) {
  const d = new Date(v)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// --------- MODAL EDIT ----------
const editDialog = ref(false)

const editForm = ref({
  firstName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  gender: '',
  comments: '',
  subscriptionEndDate: null as any,
  dailyPlayTimeLimit: null as any,
})

const errors = ref<{ firstName?: string; lastName?: string }>({})

function editUser() {
  if (!user.value) return
  editForm.value = {
    firstName: user.value.firstName ?? '',
    lastName: user.value.lastName ?? '',
    phoneNumber: user.value.phoneNumber ?? '',
    email: user.value.email ?? '',
    gender: user.value.gender ?? '',
    comments: user.value.comments ?? '',
    subscriptionEndDate: user.value.subscription?.subscriptionEndDate ?? null,
    dailyPlayTimeLimit: user.value.subscription?.dailyPlayTimeLimit ?? null,
  }
  editDialog.value = true
}

function validateForm() {
  errors.value = {}
  if (!editForm.value.firstName.trim()) {
    errors.value.firstName = 'Імʼя обовʼязкове'
  }
  if (!editForm.value.lastName.trim()) {
    errors.value.lastName = 'Прізвище обовʼязкове'
  }
  return Object.keys(errors.value).length === 0
}

async function saveUser() {
  if (!validateForm()) return
  if (!user.value) return

  try {
    const payload = {
      userId: user.value.id,   // ⚠️ перевір що у тебе саме `id` а не `uid`
      updatedData: {
        firstName: editForm.value.firstName,
        lastName: editForm.value.lastName,
        phoneNumber: editForm.value.phoneNumber,
        email: editForm.value.email,
        gender: editForm.value.gender,
        comments: editForm.value.comments,
        subscription: {
          subscriptionEndDate: editForm.value.subscriptionEndDate,
          dailyPlayTimeLimit: editForm.value.dailyPlayTimeLimit,
          isActive: true, // можна підставити значення по логіці
        },
      },
    }

    await axios.post(CF_UPDATE_PROFILE, payload)

    // оновлюємо локальні дані користувача
    user.value = {...user.value, ...payload.updatedData}

    copyText.value = 'Успішно збережено'
    copySnackbar.value = true
    editDialog.value = false
  } catch (err: any) {
    console.error('Помилка при оновленні користувача', err)
    copyText.value = 'Помилка при збереженні'
    copySnackbar.value = true
  }
}

// інші дії
function deleteUser() {
}

function clearDeviceId() {
}
</script>


<template>
  <!-- Модальне вікно -->
  <VDialog v-model="editDialog" max-width="600">
    <VCard>
      <VCardTitle>Редагування користувача</VCardTitle>
      <VDivider/>
      <VCardText>
        <VTextField
          v-model="editForm.firstName"
          label="Імʼя"
          :error-messages="errors.firstName"
          required
          class="mb-4"
        />
        <VTextField
          v-model="editForm.lastName"
          label="Прізвище"
          :error-messages="errors.lastName"
          required
          class="mb-4"
        />
        <VTextField
          v-model="editForm.phoneNumber"
          label="Телефон"
          prefix="+38"
          class="mb-4"
        />

        <VTextField
          v-model="editForm.email"
          label="Email"
          type="email"
          class="mb-4"
        />
        <VSelect
          v-model="editForm.gender"
          label="Стать"
          :items="[
    { title: 'Чоловіча', value: 'Male' },
    { title: 'Жіноча', value: 'Female' },
    { title: 'Не вказано', value: 'Not specified' }
  ]"
          item-title="title"
          item-value="value"
          class="mb-4"
        />
        <VTextarea
          v-model="editForm.comments"
          label="Коментар"
          class="mb-4"
        />

        <VTextField
          v-model="editForm.dailyPlayTimeLimit"
          label="Хвилин на день"
          type="number"
          class="mb-4"
        />
        <VDateInput
          v-model="editForm.subscriptionEndDate"
          label="Активний до"
          class="mb-4"
        />
      </VCardText>
      <VDivider/>
      <VCardActions class="pt-3">
        <VBtn size="small" color="error" variant="flat" @click="editDialog=false">Скасувати</VBtn>
        <VBtn size="small" color="primary" variant="flat" @click="saveUser">Зберегти</VBtn>

      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Snackbar -->
  <VSnackbar v-model="copySnackbar" timeout="1600" location="top" color="success">
    {{ copyText }}
  </VSnackbar>

  <!-- Основний контент -->
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-x-3">
            <VBtn variant="text" prepend-icon="tabler-arrow-left" @click="router.push('/users')">
              Назад
            </VBtn>
            <span class="text-h6">Картка користувача</span>
          </div>
          <div class="d-flex align-center gap-x-2">
            <VBtn size="small" color="primary" variant="flat" @click="editUser">Редагувати</VBtn>
            <VBtn size="small" color="error" variant="flat" @click="deleteUser">Видалити</VBtn>
          </div>
        </VCardTitle>
        <VDivider/>

        <VCardText>
          <div v-if="errorMsg" class="mb-4">
            <VAlert type="error" variant="tonal">{{ errorMsg }}</VAlert>
          </div>

          <div v-if="loading" class="d-flex justify-center py-8">
            <VProgressCircular indeterminate/>
          </div>

          <template v-else>
            <VRow>
              <!-- Ліва картка -->
              <VCol cols="12" md="6">
                <VCard variant="tonal" class="pa-4">
                  <div class="d-flex flex-column align-center text-center">
                    <div class="w-100 position-relative mb-8">
                      <VImg

                        :src="themeUser"
                        class="mx-auto"
                      />
                      <!--                      <div class="rounded w-100 " style="height:112px; background: linear-gradient(90deg,#eee,#ddd);" />-->
                      <div class="position-absolute" style="top:72px; left:0; right:0;">
                        <div class="mx-auto d-flex align-center justify-center  rounded-circle elevation-2"
                             style="width:84px; height:84px; background:#e0e0e0; border:4px solid white;">
                          <!--                          <span class="text-h6">{{ (fullName[0] || 'U') }}</span>-->


                          <VIcon
                            color="primary"
                            size="55"
                            icon="tabler-user"
                          />
                        </div>
                      </div>
                    </div>

                    <div class="mt-6">
                      <h3 class="text-h6">{{ fullName }}</h3>
                      <div class="text-medium-emphasis">Email: {{ user?.email || '—' }}</div>
                      <div class="text-medium-emphasis">Телефон: {{ user?.phoneNumber || '—' }}</div>
                      <div class="text-medium-emphasis">Дата реєстрації: {{ formatDT(user?.dateCreated) }}</div>
                      <div class="text-medium-emphasis">Коментар: {{ user?.comments || '—' }}</div>
                    </div>

                    <div class="d-flex flex-wrap justify-center gap-x-3 gap-y-2 mt-4">
                      <VChip size="small" :color="isValid(user) ? 'success' : 'error'">
                        {{ isValid(user) ? 'Активний' : 'Не активний' }}
                      </VChip>
                      <span :style="{ color: isBinocular(user) ? 'green' : 'red' }">
                        {{ isBinocular(user) ? 'Два ока' : 'Одне око' }}
                      </span>
                      <label class="text-caption d-inline-flex align-center">
                        <input
                          type="checkbox"
                          class="me-1"
                          :checked="isClinic(user)"
                          @change="toggleClinic($event)"
                        >
                        Клініка
                      </label>
                    </div>

                    <div class="mt-4 text-caption text-medium-emphasis d-flex justify-space-between w-100">
                      <div>
                        <strong>Активно до:</strong>
                        {{ formatDateTime(user?.subscription?.subscriptionEndDate) }}
                      </div>
                      <div><strong style="color:red;">Сьогодні:</strong> {{ usedMinutesToday(user) }} хв.</div>
                      <div><strong>Доступно на день:</strong> {{ user?.subscription?.dailyPlayTimeLimit ?? '—' }} хв.
                      </div>
                    </div>
                  </div>
                </VCard>
              </VCol>

              <!-- Права: графік -->
              <VCol cols="12" md="6">
                <VCard class="pa-4">
                  <div class="text-subtitle-1 mb-3">Щоденна активність (хв)</div>
                  <DailyPlayTimesChart
                    v-if="user?.dailyPlayTimes || user?.subscription?.dailyPlayTimes"
                    :times="user?.dailyPlayTimes || user?.subscription?.dailyPlayTimes"
                  />
                  <div v-else class="text-medium-emphasis">Немає даних для графіка</div>
                </VCard>
              </VCol>

              <!-- Промокоди -->
              <VCol cols="12">
                <VCard class="pa-4">
                  <div class="text-subtitle-1 mb-3">Промокоди</div>
                  <!--                  <div class="text-caption text-medium-emphasis mb-2">Список використаних промокодів</div>-->

                  <VTable class="text-no-wrap">
                    <thead>
                    <tr>
                      <th class="py-2 px-3 text-left">Промокод</th>
                      <th class="py-2 px-3 text-left">Використаний</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(promo, idx) in (user?.subscription?.usedPromoCodes || [])" :key="idx">
                      <td class="py-2 px-3">{{ promo?.promoCode ?? '—' }}</td>
                      <td class="py-2 px-3">{{ promo?.usedAt ? formatDT(promo.usedAt) : '—' }}</td>
                    </tr>
                    <tr v-if="!(user?.subscription?.usedPromoCodes || []).length">
                      <td colspan="2" class="py-4 text-center text-medium-emphasis">Промокоди не використовувались</td>
                    </tr>
                    </tbody>
                  </VTable>
                </VCard>
              </VCol>

              <!-- Користувачі клініки -->
              <VCol cols="12" v-if="isClinic(user)">
                <ClinicUsersTable :clinic-user="user" :users="[]"/>
              </VCol>
            </VRow>
          </template>
        </VCardText>
      </VCard>
    </VCol>
    <VCol cols="12">
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-x-3">

            <span class="text-h6">Ігри (сортування по кількості спроб )</span>
          </div>

        </VCardTitle>
        <VDivider/>

        <VCardText>


          <VRow>
            <VCol
              v-for="game in gamesList"
              :key="game.id"
              cols="12" sm="6" md="4" lg="3"
            >
              <VCard class="pa-4 text-center">
                <div class="text-medium-emphasis mb-2">{{ game.name }}</div>

                <VTooltip text="Прогрес це - успішні спроби / спроби * 100">
                  <template #activator="{ props }">
                    <VProgressCircular
                      v-bind="props"
                      :rotate="360"
                      :size="70"
                      :width="6"
                      :model-value="game.attempts ? Math.round((game.successfulAttempts / game.attempts) * 100) : 0"
                      color="primary"
                      class="mb-2"
                    >
                      {{ game.attempts ? Math.round((game.successfulAttempts / game.attempts) * 100) : 0 }}%
                    </VProgressCircular>
                  </template>
                </VTooltip>

                <hr class="v-divider v-divider.v-divider--vertical">
                <div class="d-flex justify-space-between mt-2 mb-2">

                  <VTooltip text="Кількість спроб зіграти в гру">
                    <template #activator="{ props }">
                      <div v-bind="props" class=" " style="width: 40%">
                        <div class="text-caption">Спроби</div>
                        <div>{{ game.attempts }}</div>
                      </div>

                    </template>
                  </VTooltip>
                  <hr class="v-divider--vertical" style="border-color:#e3e0f51f">


                  <VTooltip text="Кількість успішних спроб (тобто виграли)">
                    <template #activator="{ props }">
                      <div v-bind="props" style="width: 40%">
                        <div class="text-caption">Успіхи</div>
                        <VChip color="success">{{ game.successfulAttempts }}</VChip>
                      </div>
                    </template>
                  </VTooltip>
                </div>
                <hr class="v-divider">

                <div class="d-flex justify-space-between mt-2 mb-2">

                  <VTooltip
                    text="Це кількість уроків, урок рахується якщо гравець почав грати гру і зіграв мінімум 4 хв (в нас є панелька де пацієнти клініки і там відображається кількість уроків скільки зіграв пацієнт) ">
                    <template #activator="{ props }">
                      <div v-bind="props"  style="width: 40%">
                        <div class="text-caption">Уроки</div>
                        <div>{{ game.sessions }}</div>
                      </div>
                    </template>
                  </VTooltip>

                  <hr class="v-divider--vertical" style="border-color:#e3e0f51f">

                  <VTooltip text="Очки які гравець здобуває в грі">
                    <template #activator="{ props }">
                      <div v-bind="props" style="width: 40%">
                        <div class="text-caption">Очки</div>
                        <div>{{ game.totalPoints }}</div>
                      </div>
                    </template>
                  </VTooltip>

                </div>
                <hr class="v-divider ">

                <div class="mt-2">
                  <div class="text-caption text-medium-emphasis mb-1">Коректність кольорів (2 ока)</div>
                  <div class="d-flex justify-space-between">
                    <div>
                      <div class="text-caption">Червоні (помилки)</div>
                      <div>{{ game.correctColorRecord.redIncorrect ?? 0 }}</div>
                    </div>
                    <div>
                      <div class="text-caption">Сині (помилки)</div>
                      <div>{{ game.correctColorRecord.blueIncorrect ?? 0 }}</div>
                    </div>
                    <div>
                      <div class="text-caption">Влучання</div>
                      <div>{{ game.correctColorRecord.totalCorrect ?? 0 }}</div>
                    </div>
                  </div>
                </div>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
.position-absolute {
  position: absolute;
}

.position-relative {
  position: relative;
}

.rounded-circle {
  border-radius: 9999px;
}
</style>
