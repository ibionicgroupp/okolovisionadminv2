import { setupLayouts } from 'virtual:meta-layouts'
import { createRouter, createWebHistory } from 'vue-router/auto'

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
  extendRoutes: pages => [
    ...[...pages].map(route => recursiveLayouts(route)),
  ],
})


import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/plugins/firebase' // <-- додай цей імпорт на початку файлу

let authReady = false
let currentUser = null

onAuthStateChanged(auth, user => {
    currentUser = user
    authReady = true
})

router.beforeEach(async (to) => {
    // чекаємо перший зворотній виклик onAuthStateChanged (щоб не було "стрибка" при перезавантаженні)
    if (!authReady) {
        await new Promise(resolve => {
            const stop = onAuthStateChanged(auth, () => {
                stop()
                resolve()
            })
        })
    }

    const isPublic = to.meta?.public === true
    const isAuthed = !!currentUser

    // заблокуємо доступ до приватних сторінок
    if (!isPublic && !isAuthed) {
        return { name: 'login' } // автороутер має login-роут (див. нижче)
    }

    // навпаки, якщо ти вже увійшов і зайшов на /login — редірект на домашню
    if (isPublic && isAuthed && (to.name === 'login' || to.path.includes('/login'))) {
        return { name: 'root' } // або постав будь-який дефолтний маршрут
    }

    // інакше — пускаємо
    return true
})



export { router }
export default function (app) {
  app.use(router)
}
