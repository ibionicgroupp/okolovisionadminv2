<script setup lang="ts">
import axios from 'axios'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import UserStats from "../pages/UserStats.vue"

definePage({ meta: { layout: 'default' } })
const router = useRouter()

import { CLOUD_FUNCTIONS } from '@/utils/cloudFunctions'

/* ---------------- CONFIG ---------------- */
const CF_ENDPOINT = CLOUD_FUNCTIONS.ADMIN_LIST_USERS
// Пошуковий ендпоінт більше не потрібен — все робимо на фронті
// const SEARCH_ENDPOINT = "..."

/* ---------------- STATE ---------------- */
type UserRaw = {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  comments?: string
  dateCreated?: any
  subscription?: { subscriptionEndDate?: any }
  isClinic?: boolean
  clinicId?: string
  _type?: 'clinic' | 'clinicUser' | 'own'
  _isActive?: boolean | null
  _statusSort?: number
  _endMs?: number
  _createdAtMs?: number
  _fullName?: string
  _email?: string
  _phone?: string
  _additionalPromoCode?: string
  _searchBlob?: string
  [k: string]: any
}

const loading = ref(false)
const errorMsg = ref('')

const users = ref<UserRaw[]>([])           // ВСІ користувачі (з бекенду, 1 раз)
const clinicFilter = ref<'nonClinic' | 'clinic' | 'clinicUsers' | 'all'>('all')

/* --- локальний пошук із дебаунсом --- */
const rawSearch = ref('')
const search = ref('')
watch(rawSearch, (v) => {
  const val = String(v ?? '')
  clearTimeout((watch as any)._t)
  ;(watch as any)._t = setTimeout(() => (search.value = val), 180)
})

/* ---------------- HELPERS ---------------- */
function normalizeDate(val: any) {
  if (!val) return 0
  const t = new Date(val).getTime()
  return Number.isNaN(t) ? 0 : t
}
function formatDate(val: any) {
  if (!val) return '—'
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(String(val))
  if (m) {
    const [_, dd, MM, yyyy] = m
    const d = new Date(Number(yyyy), Number(MM) - 1, Number(dd))
    return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  const d = new Date(val)
  if (Number.isNaN(d.getTime())) return String(val)
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function enrich(u: UserRaw) {
  const fullName = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim()
  const email = u.email || ''
  const phone = u.phoneNumber ? String(u.phoneNumber) : ''
  const additionalPromoCode = u.additionalPromoCode || '—'

  return {
    ...u,
    _fullName: fullName,
    _email: email,
    _phone: phone,
    _additionalPromoCode: additionalPromoCode,
    _createdAtSort: u._createdAtMs ?? normalizeDate(u.dateCreated),
    _subscriptionEndSort: u._endMs ?? normalizeDate(u?.subscription?.subscriptionEndDate),
    _searchBlob: [u.id, fullName, email, phone, u.comments, additionalPromoCode]
      .filter(Boolean)
      .join(' ')
      .toLowerCase(),
  }
}

/* ---------------- HEADERS ---------------- */
const headers = [
  { title: 'ID',             key: 'id',                 sortable: false, width: 70 },
  { title: 'Статус',         key: '_statusSort',        sortable: true,  width: 130 },
  { title: 'Дійсний до',     key: '_subscriptionEndSort', sortable: true, width: 170 },
  { title: 'ПІБ',            key: '_fullName',          sortable: true },
  { title: 'Контакти',       key: 'contacts',           sortable: false, width: 240 },
  { title: 'Промокод на знижку', key: '_additionalPromoCode', sortable: false, width: 170 },
  { title: 'Дата створення', key: '_createdAtSort',     sortable: true,  width: 160 },
]

/* ---------------- FETCH (один раз, без пагінації) ---------------- */
async function initialLoadAll() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await axios.post(CF_ENDPOINT, { clinicFilter: clinicFilter.value })

    const data = Array.isArray(res.data?.data) ? res.data.data : []
    users.value = data.map(enrich)
  } catch (e: any) {
    console.error(e)
    errorMsg.value = 'Помилка завантаження користувачів'
  } finally {
    loading.value = false
  }
}
onMounted(initialLoadAll)

/* ---------------- CLIENT FILTER + SEARCH ---------------- */
const viewItems = computed(() => {
  const q = search.value.trim().toLowerCase()

  return users.value
    .filter(u => {
      if (clinicFilter.value === 'all') return true
      if (clinicFilter.value === 'clinic') return u._type === 'clinic'
      if (clinicFilter.value === 'clinicUsers') return u._type === 'clinicUser'
      if (clinicFilter.value === 'nonClinic') return u._type === 'own'
      return true
    })
    .filter(u => (!q ? true : (u._searchBlob || '').includes(q)))
})

/* ---------------- TABLE ---------------- */
function onRowClick(_: MouseEvent, row: any) {
  const id =
    row?.item?.raw?.id ??
    row?.item?.id ??
    row?.internalItem?.value?.id ??
    row?.id
  if (id) window.open(`/user/${id}`, '_blank')
}
function rowProps() {
  return { class: 'row-clickable', style: 'cursor:pointer' }
}

/* ---------------- COPY ---------------- */
const copySnackbar = ref(false)
const copyText = ref('')
async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = value
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch {}
    document.body.removeChild(ta)
  } finally {
    copyText.value = 'Скопійовано'
    copySnackbar.value = true
  }
}

/* ---------------- SORT ---------------- */
// локальне сортування працює з _createdAtSort / _subscriptionEndSort / _statusSort
const sortBy = ref([{ key: '_createdAtSort', order: 'desc' }])
</script>

<template>
  <VRow>
    <VCol cols="12">
      <UserStats />
    </VCol>

    <VCol cols="12">
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <span class="text-h6">Користувачі</span>
          <div class="d-flex align-center gap-x-3">
            <VSelect
              v-model="clinicFilter"
              :items="[
                { title: 'Користувачі без клінік', value: 'nonClinic' },
                { title: 'Клініки', value: 'clinic' },
                { title: 'Користувачі клінік', value: 'clinicUsers' },
                { title: 'Всі', value: 'all' }
              ]"
              hide-details
              density="comfortable"
              style="min-width: 300px"
            />
            <VTextField
              v-model="rawSearch"
              density="comfortable"
              placeholder="Пошук (ID / ПІБ / email / телефон / коментар / промокод)"
              style="min-width: 360px"
              clearable
              hide-details
              prepend-inner-icon="tabler-search"
              @click:clear="rawSearch = ''"
              @keydown.enter="$event.target.blur()"
            />
          </div>
        </VCardTitle>

        <VDivider />

        <VCardText>
          <div v-if="errorMsg" class="mb-4">
            <VAlert type="error" variant="tonal">{{ errorMsg }}</VAlert>
          </div>

          <div v-if="loading" class="d-flex justify-center py-6">
            <VProgressCircular indeterminate />
          </div>

          <div v-else>
<!--            <VDataTableVirtual-->
<!--              :headers="headers"-->
<!--              :items="viewItems"-->
<!--              item-key="id"-->
<!--              height="600"-->
<!--              v-model:sort-by="sortBy"-->
<!--              @click:row="onRowClick"-->
<!--              :row-props="rowProps"-->
<!--            />-->
            <VDataTable
              :headers="headers"
              :items="viewItems"
              item-key="id"
              hover
              sticky
              height="600"
              :items-per-page="50"
              v-model:sort-by="sortBy"
              show-current-page
              show-first-last-page
              items-per-page-text="Кількість на сторінку:"
            @click:row="onRowClick"
            :row-props="rowProps"
            >




            <template #item.id="{ item }">
              <VTooltip v-if="item._type === 'clinic'" text="Клініка">
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon="tabler-building-hospital"
                    variant="text"
                    rounded
                    color="primary"
                    @click.stop="copy(item.id)"
                  />
                </template>
              </VTooltip>

              <VTooltip v-else-if="item._type === 'clinicUser'" text="Користувач клініки">
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon="tabler-user-shield"
                    variant="text"
                    rounded
                    color="secondary"
                    @click.stop="copy(item.id)"
                  />
                </template>
              </VTooltip>

              <VTooltip v-else text="Користувач">
                <template #activator="{ props }">
                  <VBtn
                    v-bind="props"
                    icon="tabler-user"
                    variant="text"
                    rounded
                    color="success"
                    @click.stop="copy(item.id)"
                  />
                </template>
              </VTooltip>
            </template>

            <!-- Статус -->
            <template #item._statusSort="{ item }">
              <template v-if="item._type === 'clinicUser'">
                — <!-- для користувачів клінік статус не показуємо -->
              </template>
              <template v-else>
                <VChip size="small" :color="item._isActive ? 'success' : 'error'">
                  {{ item._isActive ? 'Активний' : 'Неактивний' }}
                </VChip>
              </template>
            </template>

            <!-- Дійсний до -->
            <template #item._subscriptionEndSort="{ item }">
              {{ item.subscription?.subscriptionEndDate



              ? formatDate(item.subscription.subscriptionEndDate)
              : '—' }}
            </template>

            <!-- ПІБ -->
            <template #item._fullName="{ item }">
              {{ item._fullName || '—' }}
            </template>

            <!-- Контакти -->
            <template #item.contacts="{ item }">
              <div class="d-flex flex-column">
                <VTooltip text="Натисніть щоб скопіювати" location="top">
                  <template #activator="{ props }">
                    <button v-bind="props" v-if="item._email" class="linklike" type="button" @click.stop="copy(item._email)">
                      {{ item._email }}
                    </button>
                  </template>
                </VTooltip>
                <VTooltip text="Натисніть щоб скопіювати" location="top">
                  <template #activator="{ props }">
                    <button v-bind="props" v-if="item._phone" class="linklike" type="button" @click.stop="copy(item._phone)">
                      {{ item._phone }}
                    </button>
                  </template>
                </VTooltip>
              </div>
            </template>

            <!-- Промокод -->
            <template #item._additionalPromoCode="{ item }">
              {{ item._additionalPromoCode || '—' }}
            </template>

            <!-- Дата створення -->
            <template #item._createdAtSort="{ item }">
              {{ formatDate(item.dateCreated) }}
            </template>
              <template #footer.page-text="{ itemsLength }">
                Всього: {{ itemsLength }}
              </template>
            <!-- Порожньо -->
            <template #no-data>
              <div class="py-6 text-center text-medium-emphasis">Даних немає</div>
            </template>
            </VDataTable>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <VSnackbar v-model="copySnackbar" timeout="1600" location="top" color="success">
    {{ copyText }}
  </VSnackbar>
</template>

<style scoped>
.linklike {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  color: rgb(var(--v-theme-primary));
  text-align: left;
}
.row-clickable {
  /* просто стилізація клікабельного рядка */
}
</style>
