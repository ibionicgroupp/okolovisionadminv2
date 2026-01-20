# Налаштування змінних оточення

## Створення .env файлу

✅ **Файл `.env` вже створено автоматично!**

Якщо потрібно змінити значення, відредагуйте файл `.env` в корені проекту.

Поточний вміст:

```env
# Cloud Functions URLs
# Admin Functions
VITE_CF_ADMIN_LIST_USERS=https://adminlistuserslitev2-956914206562.europe-west1.run.app
VITE_CF_ADMIN_STATISTICS=https://admingetstatisticsv2-956914206562.europe-west1.run.app
VITE_CF_ADMIN_USERS_STATS=https://adminusersstatsv2-956914206562.europe-west1.run.app
VITE_CF_ADMIN_DISTRIBUTORS=https://admindistributorsv2-956914206562.europe-west1.run.app
VITE_CF_ADMIN_GET_CLINIC_USERS=https://admingetclinicusersv2-956914206562.europe-west1.run.app
VITE_CF_ADMIN_PROMOCODE_ADD=https://adminpromocodewithbarcodeaddv2-956914206562.europe-west1.run.app

# User Functions
VITE_CF_USER_GET_DATA=https://us-central1-okolovision-48840.cloudfunctions.net/userGetData
VITE_CF_USER_UPDATE_PROFILE=https://us-central1-okolovision-48840.cloudfunctions.net/userUpdateProfile
VITE_CF_USER_UPDATE_CLINIC=https://us-central1-okolovision-48840.cloudfunctions.net/userUpdateIsClinic

# Promocode Functions
VITE_CF_PROMOCODE_GET_ALL=https://us-central1-okolovision-48840.cloudfunctions.net/promocodeGetAll

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyARkaML70IyBM6RTT21cwcJ7OkOlhJwcy0
VITE_FIREBASE_AUTH_DOMAIN=okolovision-48840.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=okolovision-48840
```

## Для різних середовищ

### Development (.env.development)
```env
# Використовуйте локальні або тестові URL
VITE_CF_ADMIN_LIST_USERS=http://localhost:5001/okolovision-48840/europe-west1/adminlistuserslitev2
```

### Production (.env.production)
```env
# Використовуйте продакшн URL
VITE_CF_ADMIN_LIST_USERS=https://adminlistuserslitev2-956914206562.europe-west1.run.app
```

## Важливо

1. **НЕ комітьте `.env` файл в Git** - він вже в `.gitignore`
2. **Додайте `.env.example`** з прикладами (без реальних URL)
3. **Перезапустіть dev сервер** після зміни `.env` файлу

## Перевірка

Після створення `.env` файлу, перезапустіть dev сервер:

```bash
npm run dev
```

У консолі має з'явитися:
```
✅ Cloud Functions URLs loaded: 10
```

Якщо з'являються помилки про відсутні змінні - перевірте назви змінних у `.env` файлі.
