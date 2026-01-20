/**
 * Централізована конфігурація URL Cloud Functions
 * Використовує змінні оточення для різних середовищ
 */

// Валідація URL
function validateUrl(url: string | undefined, name: string): string {
  if (!url) {
    console.error(`⚠️ Відсутня змінна оточення для ${name}`)
    throw new Error(`Missing environment variable for ${name}`)
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.error(`⚠️ Невірний формат URL для ${name}: ${url}`)
    throw new Error(`Invalid URL format for ${name}`)
  }
  return url
}

export const CLOUD_FUNCTIONS = {
  // Admin functions
  ADMIN_LIST_USERS: validateUrl(
    import.meta.env.VITE_CF_ADMIN_LIST_USERS,
    'ADMIN_LIST_USERS'
  ),
  ADMIN_STATISTICS: validateUrl(
    import.meta.env.VITE_CF_ADMIN_STATISTICS,
    'ADMIN_STATISTICS'
  ),
  ADMIN_USERS_STATS: validateUrl(
    import.meta.env.VITE_CF_ADMIN_USERS_STATS,
    'ADMIN_USERS_STATS'
  ),
  ADMIN_DISTRIBUTORS: validateUrl(
    import.meta.env.VITE_CF_ADMIN_DISTRIBUTORS,
    'ADMIN_DISTRIBUTORS'
  ),
  ADMIN_GET_CLINIC_USERS: validateUrl(
    import.meta.env.VITE_CF_ADMIN_GET_CLINIC_USERS,
    'ADMIN_GET_CLINIC_USERS'
  ),
  ADMIN_PROMOCODE_ADD: validateUrl(
    import.meta.env.VITE_CF_ADMIN_PROMOCODE_ADD,
    'ADMIN_PROMOCODE_ADD'
  ),

  // User functions
  USER_GET_DATA: validateUrl(
    import.meta.env.VITE_CF_USER_GET_DATA,
    'USER_GET_DATA'
  ),
  USER_UPDATE_PROFILE: validateUrl(
    import.meta.env.VITE_CF_USER_UPDATE_PROFILE,
    'USER_UPDATE_PROFILE'
  ),
  USER_UPDATE_CLINIC: validateUrl(
    import.meta.env.VITE_CF_USER_UPDATE_CLINIC,
    'USER_UPDATE_CLINIC'
  ),

  // Promocode functions
  PROMOCODE_GET_ALL: validateUrl(
    import.meta.env.VITE_CF_PROMOCODE_GET_ALL,
    'PROMOCODE_GET_ALL'
  ),
} as const

// Перевірка всіх URL при імпорті (тільки в development)
if (import.meta.env.DEV) {
  console.log('✅ Cloud Functions URLs loaded:', Object.keys(CLOUD_FUNCTIONS).length)
}
