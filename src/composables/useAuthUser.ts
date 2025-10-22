// import { ref, onMounted } from 'vue'
// import { auth } from '@/plugins/firebase'
// import { onAuthStateChanged } from 'firebase/auth'
//
// const user = ref<any>(null)
// const claims = ref<{ role?: string; distributorId?: string }>({})
//
// export function useAuthUser() {
//   onMounted(async () => {
//     onAuthStateChanged(auth, async (u) => {
//       user.value = u
//       if (u) {
//         const token = await u.getIdTokenResult(true)
//         claims.value = {
//           role: token.claims.role,
//           distributorId: token.claims.distributorId,
//         }
//       } else {
//         claims.value = {}
//       }
//     })
//   })
//
//   return { user, claims }
// }
