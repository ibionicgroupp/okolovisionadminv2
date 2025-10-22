<script setup>
import avatar1 from '@images/avatars/avatar-1.png'
import { useRouter } from 'vue-router'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/plugins/firebase'
import { ref, onMounted } from 'vue'

const router = useRouter()
const userEmail = ref('') // 🟢 тут збережемо email користувача

// 🔹 Отримуємо email поточного користувача
onMounted(() => {
  const user = auth.currentUser
  if (user) {
    userEmail.value = user.email
  } else {
    // якщо користувач ще не завантажений (Firebase ще ініціалізується)
    onAuthStateChanged(auth, (u) => {
      if (u) userEmail.value = u.email
    })
  }
})

// 🔹 Вихід із системи
const logout = async () => {
  try {
    await signOut(auth)
    router.push({ name: 'login' })
  } catch (error) {
    console.error('Logout error:', error)
  }
}
</script>

<template>
  <VBadge
    dot
    location="bottom right"
    offset-x="3"
    offset-y="3"
    bordered
    color="success"
  >
    <VAvatar
      class="cursor-pointer"
      color="primary"
      variant="tonal"
    >
      <VImg :src="avatar1" />

      <!-- SECTION Menu -->
      <VMenu
        activator="parent"
        width="230"
        location="bottom end"
        offset="14px"
      >
        <VList>
          <!-- 👉 User Avatar & Email -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge
                  dot
                  location="bottom right"
                  offset-x="3"
                  offset-y="3"
                  color="success"
                >
                  <VAvatar color="primary" variant="tonal">
                    <VImg :src="avatar1" />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <!-- 🟢 показуємо email -->
            <VListItemTitle class="font-weight-semibold">
              {{ userEmail || '...' }}
            </VListItemTitle>

            <!-- можеш замінити "Admin" на роль -->
<!--            <VListItemSubtitle>Admin</VListItemSubtitle>-->
          </VListItem>

          <VDivider class="my-2" />

          <!-- 👉 Logout -->
          <VListItem @click="logout">
            <template #prepend>
              <VIcon class="me-2" icon="tabler-logout" size="22" />
            </template>
            <VListItemTitle>Вихід</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
