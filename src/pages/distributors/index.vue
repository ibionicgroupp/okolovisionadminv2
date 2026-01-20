<script setup lang="ts">
import DistributorForm from '@/components/distributors/DistributorForm.vue'
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

definePage({
  name: 'distributors-list',
  meta: {
    requiresAuth: true,
  },
})

// 🔗 URL Cloud Run (твій бекенд)
const API_URL = "https://admindistributorsv2-956914206562.europe-west1.run.app"

// --------- Типи ---------
type FirestoreTimestamp = {
  _seconds: number
  _nanoseconds: number
}

type Distributor = {
  id: string
  type: 'clinic' | 'doctor'
  name: string
  phone: string
  city: string
  login: string
  createdAt?: FirestoreTimestamp
  updatedAt?: FirestoreTimestamp
}


const router = useRouter()
const items = ref<Distributor[]>([])
const query = ref('')

// 🔁 Стан UI
const loading = ref(false)
const error = ref('')
const snackbar = ref(false)
const snackbarColor = ref<'success' | 'error'>('success')
const message = ref('')


const headers = [
  { title: 'Тип', key: 'type', sortable: false, width: 140 },
  { title: "Ім'я / Назва", key: 'name', sortable: true, width: 200 },
  { title: 'Телефон', key: 'phone', sortable: true, width: 160 },
  { title: 'Місто', key: 'city', sortable: true, width: 140 },
  { title: 'Логін', key: 'login', sortable: true, width: 140 },
  { title: 'Дата створення', key: 'createdAt', sortable: true, width: 140 },
]
// -------- Завантаження списку --------
async function loadDistributors() {
  try {
    loading.value = true
    const res = await axios.post(API_URL, { action: "list" })
    items.value = res.data.data || []
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// -------- Пошук --------
const viewItems = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(d =>
    [d.id, d.name, d.city, d.phone, d.login, d.type]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(q)
  )
})



// -------- Додавання нового через Cloud Run --------
const createDialog = ref(false)
async function onCreate(payload: Omit<Distributor, 'id'>) {
  try {
    const res = await axios.post(API_URL, {
      action: "create",
      data: payload,
    })

    if (!res.data.success) {
      message.value = res.data.message
      snackbarColor.value = 'error'
      snackbar.value = true
      return
    }

    message.value = 'Дистриб’ютора створено'
    snackbarColor.value = 'success'
    snackbar.value = true

    createDialog.value = false
    await loadDistributors()

  } catch (e) {
    message.value = 'Помилка зʼєднання з сервером'
    snackbarColor.value = 'error'
    snackbar.value = true
  }
}



// -------- Перехід у карточку --------
// -------- Перехід у карточку --------
async function onRowClick(_e: any, ctx: any) {
  const row = ctx.item?.raw ?? ctx.item
  if (!row?.id) return

  try {
    // ✅ Явно переходимо на сторінку дистриб’ютора
    await router.push({ path: `/distributors/${row.id}` })
    // console.log(`➡️ Перехід до дистриб’ютора: ${row.id}`)
  } catch (err) {
    console.error('❌ Помилка переходу до дистриб’ютора:', err)
  }
}
function formatFirestoreDate(val?: FirestoreTimestamp): string {
  if (!val || !val._seconds) return '—'
  const d = new Date(val._seconds * 1000)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}


// -------- Редагування зі списку --------
const editDialog = ref(false)
const editing = ref<Distributor | null>(null)
function openEdit(row: Distributor) {
  editing.value = { ...row }
  editDialog.value = true
}

async function onUpdate(payload: Omit<Distributor, 'id'>) {
  if (!editing.value) return
  try {
    await axios.post(API_URL, {
      action: "update",
      id: editing.value.id,
      data: payload
    })
    message.value = "Зміни збережено"
    snackbar.value = true
    editDialog.value = false
    await loadDistributors()
  } catch (e) {
    message.value = "Помилка при оновленні"
    snackbar.value = true
  } finally {
    editing.value = null
  }
}

// 🟢 Завантажуємо при відкритті сторінки
onMounted(() => {
  loadDistributors()
})
</script>


<template>
 
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-4">
          <VIcon icon="tabler-users" />
          <span>Дистриб’ютори</span>
        </div>

        <div class="d-flex align-center gap-4">
<!--          <VTextField-->
<!--            v-model="query"-->
<!--            density="compact"-->
<!--            placeholder="Пошук..."-->
<!--            prepend-inner-icon="tabler-search"-->
<!--            hide-details-->
<!--            clearable-->
<!--            style="min-width: 260px; height: 38px"-->
<!--          />-->
          <VTextField
            v-model="query"
            density="comfortable"
            placeholder="Пошук..."
            clearable
            prepend-inner-icon="tabler-search"
            style="min-width: 260px; max-width: 300px"
            class="ms-auto"
          />

          <VBtn color="primary" prepend-icon="tabler-plus" @click="createDialog = true">
            Додати
          </VBtn>
        </div>
      </VCardTitle>

      <VDivider />

      <VCardText>
        <!--        {{viewItems}}-->
        <VDataTable
          :headers="headers"
          :items="viewItems"
          item-key="id"
          hover
          fixed-header
          items-per-page-text="Кількість на сторінку:"
          height="600"
          @click:row="onRowClick"
        >
          <!-- Тип -->
          <template #item.type="{ value }">
            <VChip :color="value === 'clinic' ? 'primary' : 'secondary'" size="small" variant="tonal">
              {{ value === 'clinic' ? 'Клініка' : 'Лікар' }}
            </VChip>
          </template>

          <!-- Дата створення -->
          <template #item.createdAt="{ value }">
            {{ formatFirestoreDate(value) }}
          </template>

          <!-- Дії -->
          <!--          <template #item.actions="{ item }">-->
          <!--            <VBtn-->
          <!--              size="small"-->
          <!--              variant="text"-->
          <!--              color="primary"-->
          <!--              icon="tabler-edit"-->
          <!--              @click.stop="openEdit(item.raw ?? item)"-->
          <!--            />-->
          <!--          </template>-->





          <!-- Порожньо -->
          <template #no-data>
            <div class="py-6 text-center text-medium-emphasis">Даних немає</div>
          </template>
        </VDataTable>
      </VCardText>
    </VCard>

    <!-- Створення -->
    <VDialog v-model="createDialog" max-width="640">
      <VCard>
        <VCardTitle>Додати дистриб’ютора</VCardTitle>
        <VCardText>
          <DistributorForm @submit="onCreate" />
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Редагування зі списку -->
    <VDialog v-model="editDialog" max-width="640">
      <VCard>
        <VCardTitle>Редагувати дистриб’ютора</VCardTitle>
        <VCardText>
          <DistributorForm
            :initial="editing ?? undefined"
            @submit="onUpdate"
          />
        </VCardText>
      </VCard>
    </VDialog>
 

  <VSnackbar
    v-model="snackbar"
    :color="snackbarColor"
    location="top center"
    timeout="3500"
  >
    {{ message }}
  </VSnackbar>

</template>
