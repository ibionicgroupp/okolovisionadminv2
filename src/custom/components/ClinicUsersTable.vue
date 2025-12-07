<template>
  <div>
    <!-- ЛОАДЕР -->
    <div v-if="loading" class="py-8 d-flex justify-center">
      <VProgressCircular indeterminate size="32" width="3" />
    </div>

    <!-- ТАБЛИЦЯ -->
    <div v-else class="overflow-x-auto w-100">
      <table class="min-w-full bg-white border rounded shadow text-sm w-100">
        <thead>
        <tr>
          <th class="border px-3 py-2"></th> <!-- чекбокс -->
          <th class="border px-3 py-2">№</th>
          <th class="border px-3 py-2">Ім’я та Прізвище</th>
          <th class="border px-3 py-2">Дата народження</th>
          <th class="border px-3 py-2">Телефон</th>
          <th class="border px-3 py-2">Стать</th>
          <th class="border px-3 py-2">Місто</th>
          <th class="border px-3 py-2">Кількість занять</th>
        </tr>
        </thead>

        <tbody>
        <tr v-for="(u, i) in clinicUsers" :key="u.id">
          <td class="border px-3 py-2">
            <input
              type="checkbox"
              :checked="selectedUserId === u.id"
              @change="toggleSelect(u)"
            />

          </td>
<!--          <td class="border px-3 py-2">-->
<!--            <input type="checkbox" @change="emitSelect(u)" />-->
<!--          </td>-->

          <td class="border px-3 py-2">{{ i + 1 }}</td>
<!--          <a :href="`tel:${phoneValue(u)}`">{{ phoneValue(u) }}</a>-->
          <td class="border px-3 py-2">{{ fullName(u) }} </td>
          <td class="border px-3 py-2">{{ formatDob(u) }}</td>
          <td class="border px-3 py-2">
            <a :href="`tel:${phoneValue(u)}`">{{ phoneValue(u) }}</a>
          </td>
          <td class="border px-3 py-2">{{ genderLabel(u) }}</td>
          <td class="border px-3 py-2">{{ cityValue(u) }}</td>
          <td class="border px-3 py-2">{{ sessionsCount(u) }}</td>
        </tr>
        <tr v-if="!clinicUsers.length">
          <td class="border px-3 py-2 text-center text-gray-500" colspan="7">
            Немає користувачів цієї клініки
          </td>
        </tr>
        </tbody>

      </table>
    </div>

    <!-- дебаг (за потреби):
    <pre class="text-xs mt-2">ids: {{ clinicPatientIdsNorm }}</pre>
    -->
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Теперішній користувач-клініка (якщо передаси його — ids візьмемо з clinicUser.clinicPatients)
  clinicUser: { type: Object, default: null },
  // Або можна передати ids прямо сюди (масив або JSON-рядок/CSV)
  clinicPatientIds: { type: [Array, String], default: null },
  // Масив усіх користувачів системи
  users: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

/* --------- нормалізація списку ID --------- */
function normalizeIds(ids) {
  if (!ids) return []
  let arr = ids
  if (typeof arr === 'string') {
    try { arr = JSON.parse(arr) }
    catch { arr = arr.split(/[,\s]+/).filter(Boolean) }
  }
  if (!Array.isArray(arr)) return []
  return [...new Set(arr.map(String))] // унікальні як рядки
}

const clinicPatientIdsNorm = computed(() => {
  // пріоритет: явний пропс clinicPatientIds, інакше беремо з clinicUser.clinicPatients
  const raw = props.clinicPatientIds ?? props.clinicUser?.clinicPatients
  return normalizeIds(raw)
})

/* --------- фільтрація користувачів по id ∈ clinicPatients --------- */
/* ВАЖЛИВО: шукаємо СТРОГО по полю u.id (як ти і просив) */
const clinicUsers = computed(() => {
  const set = new Set(clinicPatientIdsNorm.value)
  return (props.users || [])
      .filter(u => set.has(String(u?.id)))
      .sort((a, b) => fullName(a).localeCompare(fullName(b), 'uk'))
})

/* --------- хелпери відображення --------- */
function fullName(u) {
  const f = u?.firstName ?? u?.name ?? ''
  const l = u?.lastName ?? u?.surname ?? ''
  const s = `${f} ${l}`.trim()
  return s || '-'
}
function phoneValue(u) {
  return u?.phoneNumber ?? u?.phone ?? u?.contactPhone ?? '-'
}
function genderLabel(u) {
  const v = String(u?.gender ?? u?.sex ?? '').trim().toLowerCase()
  if (['m','male','ч','чоловік'].includes(v)) return 'Чоловік'
  if (['f','female','ж','жінка'].includes(v)) return 'Жінка'
  return '-'
}
function cityValue(u) {
  return u?.city ?? u?.location?.city ?? u?.address?.city ?? '-'
}
function sessionsCount(u) {
  if (typeof u?.sessionsCount === 'number') return u.sessionsCount
  if (Array.isArray(u?.sessions)) return u.sessions.length
  if (Array.isArray(u?.trainings)) return u.trainings.length
  if (u?.stats?.sessions) return Number(u.stats.sessions) || 0
  const dpt = u?.dailyPlayTimes
  if (dpt && typeof dpt === 'object') {
    let c = 0; for (const k in dpt) if (Number(dpt[k]) > 0) c++; return c
  }
  return 0
}

/* --------- дати --------- */
function parseAnyDate(v) {
  if (!v) return null
  if (v instanceof Date && !isNaN(v)) return v
  if (typeof v === 'number') return new Date(v)
  const s = String(v).trim()
  if (/^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/.test(s)) { const d = new Date(s); return isNaN(d) ? null : d }
  const m = s.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/)
  if (m) return new Date(+m[3], +m[2] - 1, +m[1])
  return null
}
function formatUk(d) {
  return new Intl.DateTimeFormat('uk-UA', { year:'numeric', month:'2-digit', day:'2-digit' }).format(d)
}
function formatDob(u) {
  const raw = u?.dateOfBirth ?? u?.birthDate ?? u?.birthday ?? ''
  const d = parseAnyDate(raw)
  return d ? formatUk(d) : '-'
}



// function emitSelect(user) {
//   emit('select-user', user)
// }
const emit = defineEmits(['select-user'])
const selectedUserId = ref(null)

function toggleSelect(user) {
  if (selectedUserId.value === user.id) {
    // Якщо натиснули на вже обраного → зняти
    selectedUserId.value = null
    emit('select-user', null)
  } else {
    // Інакше вибрати нового → всі інші автоматично знімуться
    selectedUserId.value = user.id
    emit('select-user', user)
  }
}

</script>
