import { getAuth } from 'firebase/auth'

export default async function getMenu() {
    const auth = getAuth()
    const user = auth.currentUser

    // якщо користувач ще не завантажений
    if (!user) {
        return []
    }

    const token = await user.getIdTokenResult(true)
    const role = token.claims.role
    const distributorId = token.claims.distributorId

    // 🔹 меню для адміна
    if (role === 'admin') {
        return [
            { title: 'Користувачі', to: { name: 'users' }, icon: { icon: 'tabler-file' } },
            { title: 'Промокоди', to: { name: 'promocodes' }, icon: { icon: 'tabler-file' } },
            { title: 'Дистриб’ютори', to: { name: 'distributors-list' }, icon: { icon: 'tabler-users' } },
            // { title: 'Вихід', action: 'logout', icon: { icon: 'tabler-logout' } },
        ]
    }

    // 🔹 меню для дистриб’ютора
    if (role === 'distributor') {
        return [
            { title: 'Моя сторінка', to: { path: `/distributors/${distributorId}` }, icon: { icon: 'tabler-user' } },
            // { title: 'Вихід', action: 'logout', icon: { icon: 'tabler-logout' } },
        ]
    }

    // 🔹 дефолтне меню (якщо ролі немає)
    return [
        // { title: 'Вихід', action: 'logout', icon: { icon: 'tabler-logout' } },
    ]
}
