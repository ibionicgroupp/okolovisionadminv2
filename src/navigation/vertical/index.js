import { getAuth, onAuthStateChanged } from 'firebase/auth'

export default async function getMenu() {
    const auth = getAuth()

    // ⏳ Чекаємо, поки Firebase підтягне користувача
    const user = await new Promise(resolve => {
        const unsubscribe = onAuthStateChanged(auth, u => {
            unsubscribe()
            resolve(u)
        })
    })

    // якщо користувач не залогінений
    if (!user) return []

    const token = await user.getIdTokenResult(true)
    const role = token.claims.role
    const distributorId = token.claims.distributorId

    // console.log('📋 Building menu for role:', role)

    // 🔹 меню для адміна
    if (role === 'admin') {
        return [
            { title: 'Користувачі', to: { name: 'users' }, icon: { icon: 'tabler-file' } },
            { title: 'Промокоди', to: { name: 'promocodes' }, icon: { icon: 'tabler-file' } },
            { title: 'Дистриб’ютори', to: { name: 'distributors-list' }, icon: { icon: 'tabler-users' } },
        ]
    }

    // 🔹 меню для дистриб’ютора
    if (role === 'distributor') {
        return [
            { title: 'Моя сторінка', to: { path: `/distributors/${distributorId}` }, icon: { icon: 'tabler-user' } },
        ]
    }

    // 🔹 дефолтне меню (гость або без ролі)
    return []
}
