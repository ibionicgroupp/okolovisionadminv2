<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {signInWithEmailAndPassword} from 'firebase/auth'
import {
  auth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from '@/plugins/firebase'

import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import {useGenerateImageVariant} from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import {VNodeRenderer} from '@layouts/components/VNodeRenderer'
import {themeConfig} from '@themeConfig'

// Автороутер (unplugin-vue-router): робимо сторінку публічною + макет blank
definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const router = useRouter()

// Form state
const form = ref({
  email: '',
  password: '',
  remember: false,
})
const isPasswordVisible = ref(false)
const isSubmitting = ref(false)
const errorMsg = ref('')

// Ілюстрації/маска із теми
const authThemeImg = useGenerateImageVariant(authV2LoginIllustrationLight, authV2LoginIllustrationDark, true)
const authThemeImgBordered = useGenerateImageVariant(authV2LoginIllustrationBorderedLight, authV2LoginIllustrationBorderedDark, true)
const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

// Сабміт логіна
async function onSubmit() {
  errorMsg.value = ''
  isSubmitting.value = true
  try {
    // Remember me -> local/session persistence
    await setPersistence(auth, form.value.remember ? browserLocalPersistence : browserSessionPersistence)

    // Email/password login
    await signInWithEmailAndPassword(auth, form.value.email.trim(), form.value.password)

    // Редірект після входу: змінюй на 'root' або іншу сторінку за потреби
    router.replace({name: 'users'})
  } catch (err) {
    // Можеш розгорнути повідомлення: err.code === 'auth/invalid-credential' тощо
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
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </a>

  <VRow
    no-gutters
    class="auth-wrapper bg-surface"
  >
    <!-- Left: illustration -->
    <VCol
      lg="8"
      class="d-none d-lg-flex align-center justify-center position-relative"
    >
      <div class="d-flex align-center justify-center w-100 position-relative">
        <VNodeRenderer :nodes="themeConfig.app.logo" class="d-none"/>
        <img
          class="auth-illustration d-none d-lg-block"
          :src="authThemeImg"
          alt="auth-illustration"
          height="500"
        >
        <img
          class="auth-illustration-border d-none d-lg-block"
          :src="authThemeImgBordered"
          alt="auth-illustration"
          height="500"
        >
      </div>

      <img
        class="auth-footer-mask d-none d-lg-block"
        :src="authThemeMask"
        alt="auth-mask"
        height="130"
      >
    </VCol>

    <!-- Right: form -->
    <VCol
      cols="12"
      lg="4"
      class="auth-card-v2 d-flex align-center justify-center"
    >
      <VCard
        flat
        :min-width="500"
        :max-width="500"
        class="mt-12 mt-sm-0 pa-4"
      >
        <VCardText>
          <h5 class="text-h5 mb-1">
            {{ themeConfig.app.title }} ADMIN
          </h5>
<!--          <p class="mb-0">-->
<!--            Please sign-in to your account.-->
<!--          </p>-->
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="onSubmit">
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="form.email"
                  label="Email"
                  type="email"
                  autocomplete="email"
                  :disabled="isSubmitting"
                  required
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="form.password"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  label="Password"
                  autocomplete="current-password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                  :disabled="isSubmitting"
                  required
                />
              </VCol>

<!--              <VCol cols="12" class="d-flex align-center justify-space-between">-->
<!--                <VCheckbox-->
<!--                  v-model="form.remember"-->
<!--                  label="Remember me"-->
<!--                  :disabled="isSubmitting"-->
<!--                  density="compact"-->
<!--                  hide-details-->
<!--                />-->
<!--                &lt;!&ndash; Можеш підв’язати recovery route &ndash;&gt;-->
<!--                <a class="text-primary" href="javascript:void(0)">Forgot Password?</a>-->
<!--              </VCol>-->

              <VCol cols="12" v-if="errorMsg">
                <VAlert type="error" variant="tonal" density="comfortable">
                  {{ errorMsg }}
                </VAlert>
              </VCol>

              <VCol cols="12">
                <VBtn
                  block
                  color="primary"
                  type="submit"
                  :loading="isSubmitting"
                  :disabled="isSubmitting"
                >
                  Вхід
                </VBtn>
              </VCol>

              <!-- Соц-провайдери (за бажання) -->
<!--              <VCol cols="12" class="text-center">-->
<!--                <VDivider class="my-4"/>-->
<!--                <AuthProvider/>-->
<!--              </VCol>-->
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
