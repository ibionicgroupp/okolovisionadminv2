import { setupLayouts } from 'virtual:meta-layouts'
import { createRouter, createWebHistory } from 'vue-router/auto'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/plugins/firebase'

function recursiveLayouts(route) {
    if (route.children) {
        for (let i = 0; i < route.children.length; i++)
            route.children[i] = recursiveLayouts(route.children[i])
        return route
    }
    return setupLayouts([route])[0]
}

const router = createRouter({

    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior(to) {
        if (to.hash) return { el: to.hash, behavior: 'smooth', top: 60 }
        return { top: 0 }
    },
    extendRoutes: (pages) => [

        // ❌ Прибрали redirect '/' → '/users'
        ...[...pages].map((route) => recursiveLayouts(route)),
    ],
})
console.log('🔍 All routes:', router.getRoutes().map(r => r.path))

// -------- Авторизація --------
let authReady = false
let currentUser = null

onAuthStateChanged(auth, (user) => {
    currentUser = user
    authReady = true
    // console.log('🔐 Auth state changed:', user ? user.email : 'Not logged in')
})

router.beforeEach(async (to) => {
    // чекаємо користувача
    if (!authReady) {
        await new Promise((resolve) => {
            const stop = onAuthStateChanged(auth, (user) => {
                currentUser = user
                stop()
                resolve()
            })
        })
    }

    const isPublic = to.meta?.public === true
    const isAuthed = !!currentUser
    if (!isAuthed && !isPublic) return { name: 'login' }

    if (!currentUser) return true

    const token = await currentUser.getIdTokenResult(true)
    const role = token.claims.role
    const distributorId = token.claims.distributorId

    // console.log("🧭 Role:", role, distributorId)

    // 🔒 Обмеження для distributor
    if (role === "distributor") {
        const isOwnPage = to.path === `/distributors/${distributorId}`
        const isLogout = to.name === 'logout'

        // дозволяємо доступ до /users/... тільки адмінам
        if (!isOwnPage && !isLogout) {
            return `/distributors/${distributorId}`
        }
    }

    return true

})

export { router }
export default function (app) {
    app.use(router)
}
