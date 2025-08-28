<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

// CF-ендпоінт
const CF_ENDPOINT = 'https://us-central1-okolovision-48840.cloudfunctions.net/userGetData'

// автороутер: приватна сторінка
definePage({ meta: { layout: 'default' } })

// ТВОЇ компоненти:
import DailyPlayTimesChart from '@/custom/components/DailyPlayTimesChart.vue'
import ClinicUsersTable from '@/custom/components/ClinicUsersTable.vue'

const route = useRoute()
const router = useRouter()

type UserData = any
const user = ref<UserData | null>(null)
const loading = ref(false)
const errorMsg = ref('')

// helpers
function toDate(v:any){ const d=new Date(v); return Number.isNaN(d.getTime())?null:d }
function formatDT(v:any){
  const d=toDate(v); if(!d) return '—'
  return d.toLocaleDateString('uk-UA')+' '+d.toLocaleTimeString('uk-UA',{hour:'2-digit',minute:'2-digit'})
}
function startOfDay(d:Date){ const x=new Date(d); x.setHours(0,0,0,0); return x }
function parseSubDate(v:any){
  if(!v) return null; if(v instanceof Date) return v; if(typeof v==='number') return new Date(v)
  const s=String(v).trim()
  if(/^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/.test(s)){ const d=new Date(s); return isNaN(d as any)?null:d }
  const m=s.match(/^(\d{2})[-/.](\d{2})[-/.](\d{4})$/); if(m) return new Date(+m[3],+m[2]-1,+m[1])
  return null
}
function isActive(u:any){ return u?.subscription?.isActive===true }
function isValidDateOff(u:any){
  const end=parseSubDate(u?.subscription?.subscriptionEndDate)
  return !!end && startOfDay(end).getTime()>=startOfDay(new Date()).getTime()
}
function isValid(u:any){ return isActive(u)&&isValidDateOff(u) }
function isBinocular(u:any){
  const v=u?.settings?.IsBinocularMode ?? u?.settings?.isBinocularMode ?? u?.settings?.binocularMode ?? u?.settings?.BinocularMode
  return v===true||v===1||v==='1'||v==='true'||v==='True'
}
function isClinic(u:any){ const v=u?.isClinic ?? u?.IsClinic ?? u?.clinic; return v===true||v===1||v==='1'||v==='true'||v==='True' }
function kyivKey(){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Kyiv',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date())
  const y=parts.find(p=>p.type==='year')?.value, m=parts.find(p=>p.type==='month')?.value, d=parts.find(p=>p.type==='day')?.value
  return `${y}-${m}-${d}`
}
function usedMinutesToday(u:any){
  const t=u?.subscription?.dailyPlayTimes ?? u?.dailyPlayTimes ?? {}
  return Math.round(Number(t?.[kyivKey()] ?? 0))
}

const fullName = computed(()=> user.value ? `${user.value.firstName??''} ${user.value.lastName??''}`.trim()||'—':'—')

// fetch
async function fetchUser(){
  loading.value=true; errorMsg.value=''
  try{
    const id=route.params.id as string
    const res=await axios.post(CF_ENDPOINT,{ userId:id })
    user.value=res.data?.data ?? null
  }catch(e:any){
    console.error(e); errorMsg.value=e?.response?.data?.message||'Не вдалося завантажити користувача'
  }finally{ loading.value=false }
}

onMounted(fetchUser)

// дії — заглушки (заміниш на свої CF)
function editUser() {}
function deleteUser() {}
function clearDeviceId() {}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-x-3">
            <VBtn variant="text" prepend-icon="tabler-arrow-left" @click="router.push('/users-page')">
              Назад до списку
            </VBtn>
            <span class="text-h6">Картка користувача</span>
          </div>
          <div class="d-flex align-center gap-x-2">
            <VBtn size="small" color="primary" @click="editUser">Редагувати</VBtn>
            <VBtn size="small" color="error" variant="tonal" @click="deleteUser">Видалити</VBtn>
            <VBtn size="small" color="pink" variant="tonal" @click="clearDeviceId">Очистити Device ID</VBtn>
          </div>
        </VCardTitle>
        <VDivider />

        <VCardText>
          <div v-if="errorMsg" class="mb-4">
            <VAlert type="error" variant="tonal">{{ errorMsg }}</VAlert>
          </div>

          <div v-if="loading" class="d-flex justify-center py-8">
            <VProgressCircular indeterminate />
          </div>

          <template v-else>
            <VRow>
              <!-- Ліва картка -->
              <VCol cols="12" md="6">
                <VCard variant="tonal" class="pa-4">
                  <div class="d-flex flex-column align-center text-center">
                    <div class="w-100 position-relative mb-8">
                      <div class="rounded w-100" style="height:112px; background: linear-gradient(90deg,#eee,#ddd);" />
                      <div class="position-absolute" style="top:72px; left:0; right:0;">
                        <div class="mx-auto d-flex align-center justify-center rounded-circle elevation-2" style="width:84px; height:84px; background:#e0e0e0; border:4px solid white;">
                          <span class="text-h6">{{ (fullName[0] || 'U') }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="mt-6">
                      <h3 class="text-h6">{{ fullName }}</h3>
                      <div class="text-medium-emphasis">Email: {{ user?.email || '—' }}</div>
                      <div class="text-medium-emphasis">Телефон: {{ user?.phoneNumber || '—' }}</div>
                      <div class="text-medium-emphasis">Дата реєстрації: {{ formatDT(user?.dateCreated) }}</div>
                    </div>

                    <div class="d-flex flex-wrap justify-center gap-x-3 gap-y-2 mt-4">
                      <VChip size="small" :color="isValid(user) ? 'success' : 'error'">
                        {{ isValid(user) ? 'Активний' : 'Не активний' }}
                      </VChip>
                      <span :style="{ color: isBinocular(user) ? 'green' : 'red' }">
                        {{ isBinocular(user) ? 'Два ока' : 'Одне око' }}
                      </span>
                      <label class="text-caption d-inline-flex align-center">
                        <input type="checkbox" class="me-1" :checked="isClinic(user)" disabled>
                        Клініка
                      </label>
                    </div>

                    <div class="mt-4 text-caption text-medium-emphasis">
                      <div><strong>Активно до:</strong> {{ user?.subscription?.subscriptionEndDate ?? '—' }}</div>
                      <div><strong style="color:red;">Сьогодні:</strong> {{ usedMinutesToday(user) }} хв.</div>
                      <div><strong>Доступний на день:</strong> {{ user?.subscription?.dailyPlayTimeLimit ?? '—' }} хв.</div>
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
                  <div class="text-caption text-medium-emphasis mb-2">Список використаних промокодів</div>

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
              <VCol cols="12" v-if="user">
                <ClinicUsersTable :clinic-user="user" :users="[]" />
              </VCol>
            </VRow>
          </template>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
.position-absolute { position: absolute; }
.position-relative { position: relative; }
.rounded-circle { border-radius: 9999px; }
</style>
