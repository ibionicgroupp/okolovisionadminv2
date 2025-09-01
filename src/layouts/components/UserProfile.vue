<script setup>
import avatar1 from '@images/avatars/avatar-1.png'
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import { auth } from '@/plugins/firebase'

const router = useRouter()

const logout = async () => {
  try {
    await signOut(auth)
    router.push({ name: 'login' }) // або '/login'
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
          <!-- 👉 User Avatar & Name -->
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
                  <VAvatar
                    color="primary"
                    variant="tonal"
                  >
                    <VImg :src="avatar1" />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

<!--            <VListItemTitle class="font-weight-semibold">-->
<!--              John Doe-->
<!--            </VListItemTitle>-->
            <VListItemSubtitle>Admin</VListItemSubtitle>
          </VListItem>

<!--          <VDivider class="my-2" />-->

<!--          &lt;!&ndash; 👉 Profile &ndash;&gt;-->
<!--          <VListItem link>-->
<!--            <template #prepend>-->
<!--              <VIcon-->
<!--                class="me-2"-->
<!--                icon="tabler-user"-->
<!--                size="22"-->
<!--              />-->
<!--            </template>-->

<!--            <VListItemTitle>Profile</VListItemTitle>-->
<!--          </VListItem>-->

<!--          &lt;!&ndash; 👉 Settings &ndash;&gt;-->
<!--          <VListItem link>-->
<!--            <template #prepend>-->
<!--              <VIcon-->
<!--                class="me-2"-->
<!--                icon="tabler-settings"-->
<!--                size="22"-->
<!--              />-->
<!--            </template>-->

<!--            <VListItemTitle>Settings</VListItemTitle>-->
<!--          </VListItem>-->

<!--          &lt;!&ndash; 👉 Pricing &ndash;&gt;-->
<!--          <VListItem link>-->
<!--            <template #prepend>-->
<!--              <VIcon-->
<!--                class="me-2"-->
<!--                icon="tabler-currency-dollar"-->
<!--                size="22"-->
<!--              />-->
<!--            </template>-->

<!--            <VListItemTitle>Pricing</VListItemTitle>-->
<!--          </VListItem>-->

<!--          &lt;!&ndash; 👉 FAQ &ndash;&gt;-->
<!--          <VListItem link>-->
<!--            <template #prepend>-->
<!--              <VIcon-->
<!--                class="me-2"-->
<!--                icon="tabler-help"-->
<!--                size="22"-->
<!--              />-->
<!--            </template>-->

<!--            <VListItemTitle>FAQ</VListItemTitle>-->
<!--          </VListItem>-->

          <!-- Divider -->
          <VDivider class="my-2" />

          <!-- 👉 Logout -->
          <VListItem @click="logout">
            <template #prepend>
              <VIcon
                class="me-2"
                icon="tabler-logout"
                size="22"
              />
            </template>
            <VListItemTitle>Вихід</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
