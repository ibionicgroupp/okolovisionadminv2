import { setupLayouts } from 'virtual:meta-layouts'
import { createRouter, createWebHistory } from 'vue-router/auto'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/plugins/firebase'

// -------- 🔹 обгортка layout'ів --------
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
        if (to.hash)
            return { el: to.hash, behavior: 'smooth', top: 60 }
        return { top: 0 }
    },
    extendRoutes: (pages) => [
        {
            path: '/',
            redirect: '/users', // 🔹 домашня сторінка після логіну
        },
        ...[...pages].map((route) => recursiveLayouts(route)),
    ],
})

// -------- 🔹 Авторизація --------
let authReady = false
let currentUser = null

onAuthStateChanged(auth, (user) => {
    currentUser = user
    authReady = true
    console.log('🔐 Auth state changed:', user ? user.email : 'Not logged in')
})

router.beforeEach(async (to) => {
    // чекаємо, поки Firebase підвантажить користувача з LocalStorage
    if (!authReady) {
        await new Promise((resolve) => {
            const stop = onAuthStateChanged(auth, (user) => {
                currentUser = user
                console.log('🔄 Initial auth check:', user ? user.email : 'Not logged in')
                stop()
                resolve()
            })
        })
    }

    const isPublic = to.meta?.public === true
    const isAuthed = !!currentUser

    // ❌ приватна сторінка, але користувач не авторизований → на login
    if (!isPublic && !isAuthed) {
        console.log('⛔ Redirect to login (not authed)')
        return { name: 'login' }
    }

    // ✅ якщо авторизований і зайшов на /login → редірект на /users
    if (isPublic && isAuthed && (to.name === 'login' || to.path.includes('/login'))) {
        console.log('➡️ Redirect from login to /users')
        return { name: 'users' }
    }

    console.log('✅ Route allowed:', to.fullPath)
    return true
})

export { router }
export default function (app) {
    app.use(router)
}
