<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import {
  auth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from '@/plugins/firebase'

import { themeConfig } from '@themeConfig'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'

// сторінка публічна
definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const router = useRouter()

const form = ref({
  email: '',
  password: '',
  remember: false,
})
const isPasswordVisible = ref(false)
const isSubmitting = ref(false)
const errorMsg = ref('')

// зображення
const authThemeImg = useGenerateImageVariant(authV2LoginIllustrationLight, authV2LoginIllustrationDark, true)
const authThemeImgBordered = useGenerateImageVariant(authV2LoginIllustrationBorderedLight, authV2LoginIllustrationBorderedDark, true)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

async function onSubmit() {
  errorMsg.value = ''
  isSubmitting.value = true

  try {
    await setPersistence(
      auth,
      form.value.remember ? browserLocalPersistence : browserSessionPersistence
    )

    const cred = await signInWithEmailAndPassword(
      auth,
      form.value.email.trim(),
      form.value.password
    )

    // 🕒 Обов’язково оновлюємо claims після логіну
    const token = await cred.user.getIdTokenResult(true)
    console.log('✅ Logged in as:', token.claims.role)

    // 🔸 Тепер редіректимо (router.beforeEach перехопить це і поведе далі)
    router.replace('/')

  } catch (err) {
    console.error(err)
    errorMsg.value = 'Невірний email або пароль'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <a href="javascript:void(0)">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo"/>
      <h1 class="auth-title">{{ themeConfig.app.title }}</h1>
    </div>
  </a>

  <VRow no-gutters class="auth-wrapper bg-surface">
    <!-- Left -->
    <VCol lg="8" class="d-none d-lg-flex align-center justify-center position-relative">
      <div class="d-flex align-center justify-center w-100 position-relative">
        <VNodeRenderer :nodes="themeConfig.app.logo" class="d-none"/>
        <img class="auth-illustration d-none d-lg-block" :src="authThemeImg" alt="auth" height="500"/>
        <img class="auth-illustration-border d-none d-lg-block" :src="authThemeImgBordered" alt="auth" height="500"/>
      </div>
      <img class="auth-footer-mask d-none d-lg-block" :src="authThemeMask" alt="mask" height="130"/>
    </VCol>

    <!-- Right -->
    <VCol cols="12" lg="4" class="auth-card-v2 d-flex align-center justify-center">
      <VCard flat :min-width="500" :max-width="500" class="mt-12 mt-sm-0 pa-4">
        <VCardText>
          <h5 class="text-h5 mb-1">{{ themeConfig.app.title }} ADMIN</h5>
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="12">
                <VTextField v-model="form.email" label="Email" type="email" required :disabled="isSubmitting"/>
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="form.password"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  label="Password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  required
                  :disabled="isSubmitting"
                />
              </VCol>

              <VCol cols="12" v-if="errorMsg">
                <VAlert type="error" variant="tonal">{{ errorMsg }}</VAlert>
              </VCol>

              <VCol cols="12">
                <VBtn block color="primary" type="submit" :loading="isSubmitting" :disabled="isSubmitting">
                  Вхід
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
