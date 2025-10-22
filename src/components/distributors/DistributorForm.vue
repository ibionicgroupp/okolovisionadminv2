<script setup lang="ts">
import { ref, computed } from 'vue'

type Distributor = {
  id?: string
  type: 'clinic' | 'doctor'
  name: string
  phone: string
  city: string
  login: string
  password: string
}

const props = defineProps<{ initial?: Distributor }>()
const emit = defineEmits<{ (e: 'submit', payload: Omit<Distributor, 'id'>): void }>()

// ------- Стейт -------
const type      = ref<'clinic' | 'doctor'>(props.initial?.type ?? 'clinic')
const name      = ref(props.initial?.name ?? '')
const phone     = ref(props.initial?.phone ?? '')
const city      = ref(props.initial?.city ?? '')
const login     = ref(props.initial?.login ?? '')
const password  = ref(props.initial?.password ?? '')

// ------- Snackbar -------
const snackbar = ref(false)
const snackbarColor = ref<'success' | 'error'>('success')
const snackbarText = ref('')

function showSnackbar(message: string, color: 'success' | 'error' = 'success') {
  snackbarText.value = message
  snackbarColor.value = color
  snackbar.value = true
}

// helper: тільки цифри
function onlyDigits(v: string) {
  return (v || '').replace(/\D/g, '')
}

// формат +380 (XX) XXX-XX-XX
function formatPhoneUaFromDigits(digits: string) {
  const d = digits.slice(0, 12)
  const cc = d.slice(0, 3)
  const a  = d.slice(3, 5)
  const b  = d.slice(5, 8)
  const c  = d.slice(8, 10)
  const e  = d.slice(10, 12)
  let out = `+${cc}`
  if (a) out += ` (${a}`
  if (a && a.length === 2) out += `)`
  if (b) out += ` ${b}`
  if (c) out += `-${c}`
  if (e) out += `-${e}`
  return out
}

// ---- Контроль телефону ----
function onPhoneInput(e: any) {
  const val = e.target.value || ''
  let digits = onlyDigits(val)
  if (!digits.startsWith('380')) digits = '380' + digits.replace(/^380/, '')
  const trimmed = digits.slice(0, 12)
  phone.value = formatPhoneUaFromDigits(trimmed)
  e.target.value = phone.value
}

function onPhonePaste(e: ClipboardEvent) {
  e.preventDefault()
  const pasted = e.clipboardData?.getData('text') || ''
  let digits = onlyDigits(pasted)
  if (!digits.startsWith('380')) digits = '380' + digits.replace(/^380/, '')
  const trimmed = digits.slice(0, 12)
  phone.value = formatPhoneUaFromDigits(trimmed)
  ;(e.target as HTMLInputElement).value = phone.value
}

// ---- Правила валідації ----
const requiredRule = (v: string) => !!v?.trim() || 'Обов’язкове поле'
const phoneRule = (v: string) =>
  onlyDigits(v).length === 12 || 'Невірний номер телефону (повинно бути 12 цифр: 380XXXXXXXXX)'

// ---- Загальна валідація ----
const valid = computed(() =>
  type.value &&
  name.value.trim() &&
  city.value.trim() &&
  login.value.trim() &&
  password.value.trim() &&
  onlyDigits(phone.value).length === 12,
)

// ------- Генератор паролю -------
function genPassword(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*'
  let out = ''
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  password.value = out
}

// ---- Сабміт ----
function submit() {
  if (!valid.value) {
    showSnackbar('Заповніть усі обов’язкові поля', 'error')
    return
  }

  emit('submit', {
    type: type.value,
    name: name.value.trim(),
    phone: phone.value.trim(),
    city: city.value.trim(),
    login: login.value.trim(),
    password: password.value,
  })

  showSnackbar('Дані успішно відправлено', 'success')
}
</script>

<template>
  <VForm @submit.prevent="submit">
    <VRow>
      <VCol cols="12" md="6">
        <VSelect
          label="Клініка або Лікар"
          :items="[
            { title: 'Клініка', value: 'clinic' },
            { title: 'Лікар',   value: 'doctor' },
          ]"
          v-model="type"
          :rules="[requiredRule]"
          required
          validate-on="blur"
        />
      </VCol>

      <VCol cols="12" md="6">
        <VTextField
          label="Ім'я"
          v-model="name"
          :rules="[requiredRule]"
          required
          validate-on="blur"
        />
      </VCol>

      <VCol cols="12" md="6">
        <VTextField
          label="Номер телефону"
          v-model="phone"
          @input="onPhoneInput"
          @paste="onPhonePaste"
          placeholder="+380 (__) ___-__-__"
          inputmode="numeric"
          pattern="\d*"
          :rules="[requiredRule, phoneRule]"
          required
          validate-on="blur"
        />
      </VCol>

      <VCol cols="12" md="6">
        <VTextField
          label="Місто"
          v-model="city"
          :rules="[requiredRule]"
          required
          validate-on="blur"
        />
      </VCol>

      <VCol cols="12" md="6">
        <VTextField
          label="Логін"
          v-model="login"
          :rules="[requiredRule]"
          required
          validate-on="blur"
        />
      </VCol>

      <VCol cols="12" md="6">
        <VTextField
          label="Пароль"
          v-model="password"
          type="text"
          :rules="[requiredRule]"
          required
          validate-on="blur"
        >
          <template #append-inner>
            <VBtn size="small" variant="tonal" @click="genPassword()">Згенерувати</VBtn>
          </template>
        </VTextField>
      </VCol>

      <VCol cols="12" class="d-flex justify-end">
        <VBtn color="primary" type="submit">Додати</VBtn>
      </VCol>
    </VRow>
  </VForm>

  <VSnackbar
    v-model="snackbar"
    :color="snackbarColor"
    timeout="2500"
    location="top"
  >
    {{ snackbarText }}
  </VSnackbar>
</template>
