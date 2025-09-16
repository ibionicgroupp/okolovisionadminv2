<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import UserStats from "../pages/UserStats.vue"
import axios from 'axios'

definePage({ meta: { layout: 'default' } })
const router = useRouter()

/* ---------------- CONFIG ---------------- */
const CF_ENDPOINT = "https://adminlistuserslitev2-956914206562.europe-west1.run.app"
const FIRST_PAGE_SIZE = 200
const NEXT_PAGE_SIZE  = 400
const TABLE_PAGE_SIZE = 10
const PREFETCH_THRESHOLD = 2

/* ---------------- STATE ---------------- */
type UserRaw = {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phoneNumber?: string
  comments?: string
  dateCreated?: any
  subscription?: { subscriptionEndDate?: any, subscriptionEndMs?: number, isActive?: boolean }
  isClinic?: boolean
  _isActive?: boolean
  _isInactive?: boolean
  _subscriptionEndSort?: number
  _fullName?: string
  _email?: string
  _phone?: string
  _comments?: string
  _searchBlob?: string
  [k: string]: any
}
type PageToken = null | { dateCreated: any, id: string }

const loading = ref(false)
const loadingMore = ref(false)
const errorMsg = ref('')

const users = ref<UserRaw[]>([])
let nextPageToken: PageToken = null
let currentDirection: 'asc'|'desc' = 'desc'

const tablePage = ref(1)
const tableItemsPerPage = ref(TABLE_PAGE_SIZE)

/* --- пошук із дебаунсом --- */
const rawSearch = ref('')
const search = ref('')

watch(rawSearch, (v) => {
  const val = String(v ?? '')
  clearTimeout((watch as any)._t)
  ;(watch as any)._t = setTimeout(() => (search.value = val), 180)
})
watch(search, () => { tablePage.value = 1 })

/* ---------------- HELPERS ---------------- */
function normalizeDate(val: any) {
  if (!val) return 0
  const t = new Date(val).getTime()
  return Number.isNaN(t) ? 0 : t
}
function formatDate(val: any) {
  if (!val) return '—'
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? String(val) : d.toLocaleDateString('uk-UA')
}
function enrich(u: UserRaw) {
  const fullName = `${u?.firstName ?? ''} ${u?.lastName ?? ''}`.trim()
  const email = u.email || ''
  const phone = u.phoneNumber ? String(u.phoneNumber) : ''
  const comments = u.comments || '—'
  return {
    ...u,
    _fullName: fullName,
    _subscriptionEndSort: normalizeDate(u?.subscription?.subscriptionEndDate),
    _email: email,
    _phone: phone,
    _comments: comments,
    _searchBlob: [u.id, fullName, email, phone, comments].filter(Boolean).join(' ').toLowerCase(),
  }
}

/* ---------------- HEADERS ---------------- */
const headers = [
  { title: 'ID',             key: 'id',               sortable: false,  width: 70 },
  { title: 'Статус',         key: '_statusSort',      sortable: false, width: 130 },
  { title: 'Дійсний до',     key: '_subscriptionEndSort', sortable: true, width: 170 },
  { title: 'ПІБ',            key: '_fullName',        sortable: true },
  { title: 'Контакти',       key: 'contacts',         sortable: false, width: 240 },
  { title: 'Коментар',       key: '_comments',        sortable: false },
  { title: 'Дата створення', key: '_createdAtSort',   sortable: false,  width: 160 },
  { title: '', key: 'actions',   sortable: false,  width: 160 },
]

/* ---------------- FETCH ---------------- */
const clinicFilter = ref<'nonClinic' | 'clinic' | 'all'>('nonClinic')
watch(clinicFilter, () => { initialLoad() })

async function fetchPage(pageSize: number, token: PageToken, direction: 'asc'|'desc') {
  const res = await axios.post(CF_ENDPOINT, {
    pageSize,
    pageToken: token,
    direction,
    clinicFilter: clinicFilter.value,
    fields: [
      'firstName','lastName','email','phoneNumber',
      'dateCreated','subscription','comments','isClinic',
      '_isActive','_isInactive'
    ]
  })
  const data = Array.isArray(res.data?.data) ? res.data.data : []
  const nextToken: PageToken = res.data?.nextPageToken ?? null
  return { data, nextToken }
}

async function initialLoad() {
  loading.value = true
  errorMsg.value = ''
  users.value = []
  nextPageToken = null
  currentDirection = 'desc'
  tablePage.value = 1

  try {
    const { data, nextToken } = await fetchPage(FIRST_PAGE_SIZE, null, currentDirection)
    users.value = data.map(enrich)
    nextPageToken = nextToken
  } catch (e: any) {
    console.error(e)
    errorMsg.value = 'Помилка завантаження користувачів'
  } finally {
    loading.value = false
  }
}

async function loadMoreIfNeeded() {
  if (!nextPageToken || loadingMore.value) return
  const totalLoaded = users.value.length
  const currentEndIndex = tablePage.value * tableItemsPerPage.value
  const pagesLeft = Math.ceil((totalLoaded - currentEndIndex) / tableItemsPerPage.value)

  if (pagesLeft <= PREFETCH_THRESHOLD) {
    loadingMore.value = true
    try {
      const { data, nextToken } = await fetchPage(NEXT_PAGE_SIZE, nextPageToken, currentDirection)
      users.value = users.value.concat(data.map(enrich))
      nextPageToken = nextToken
    } catch (e) {
      console.error(e)
    } finally {
      loadingMore.value = false
    }
  }
}

watch([tablePage, tableItemsPerPage], () => { loadMoreIfNeeded() })

/* ---------------- SEARCH & ROWS ---------------- */
const rowsFiltered = computed(() => {
  const q = String(search.value ?? '').trim().toLowerCase()
  if (!q) return users.value
  return users.value.filter(r => r._searchBlob.includes(q))
})
function goToUser(event: any) {
  const user = event.item
  if (user?.id) router.push(`/user/${user.id}`)
}

/* ---------------- COPY ---------------- */
const copySnackbar = ref(false)
const copyText = ref('')
async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copyText.value = 'Скопійовано'
    copySnackbar.value = true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = value
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch {}
    document.body.removeChild(ta)
    copyText.value = 'Скопійовано'
    copySnackbar.value = true
  }
}

/* ---------------- SORT ---------------- */
const sortBy = ref([{ key: '_createdAtSort', order: 'desc' }])
watch(sortBy, async (arr) => {
  const s = arr?.[0]
  if (!s) return
  const dir = s.order === 'asc' ? 'asc' : 'desc'
  if (dir !== currentDirection) {
    currentDirection = dir
    await initialLoad()
  }
})

onMounted(initialLoad)
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
                { title: 'Всі', value: 'all' }
              ]"
              hide-details
              density="comfortable"
              style="min-width: 300px"
            />
            <VTextField
              v-model="rawSearch"
              density="comfortable"
              placeholder="Пошук (ID / ПІБ / email / телефон / коментар)"
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
            <div v-if="loadingMore" class="d-flex align-center gap-x-2 text-medium-emphasis mb-3">
              <VProgressCircular indeterminate size="16" width="2" />
              <span>Догружаємо дані…</span>
            </div>

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
              @click:row="goToUser"
              v-model:sort-by="sortBy"
              :items-per-page-options="[5, 10, 20, 50, -1]"
              items-per-page-text="Рядків на сторінці"
            >
              <!-- 🟢 Текст пагінації -->
              <template #footer.page-text="{ pageStart, pageStop, itemsLength }">
                {{ pageStart }}–{{ pageStop }} з {{ itemsLength }}
              </template>

              <!-- ID -->
              <template #item.id="{ item }">
                <VTooltip text="Натисніть щоб скопіювати">
                  <template #activator="{ props }">
                    <VBtn
                      v-bind="props"
                      icon="tabler-id"
                      variant="text"
                      rounded
                      color="primary"
                      @click.stop="copy(item.id)"
                    />
                  </template>
                </VTooltip>
              </template>

              <!-- Статус -->
              <template #item._statusSort="{ item }">
                <VChip size="small" :color="item._isActive ? 'success' : 'error'">
                  {{ item._isActive ? 'Активний' : 'Неактивний' }}
                </VChip>
              </template>

              <!-- Дійсний до -->
              <template #item._subscriptionEndSort="{ item }">
                {{ item.subscription?.subscriptionEndDate ? formatDate(item.subscription.subscriptionEndDate) : '—' }}
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

              <!-- Коментар -->
              <template #item._comments="{ item }">
                {{ item._comments || '—' }}
              </template>

              <!-- Дата створення -->
              <template #item._createdAtSort="{ item }">
                {{ formatDate(item.dateCreated) }}
              </template>

              <!-- Дії -->
              <template #item.actions="{ item }">
                <VBtn
                  size="small"
                  icon
                  rounded
                  color="primary"
                  variant="tonal"
                  @click.stop="router.push(`/user/${item.id}`)"
                >
                  <VIcon icon="tabler-edit" size="20" />
                </VBtn>
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
</style>
