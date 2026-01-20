# Інструкція з деплою Cloud Function `getStatistics`

## Крок 1: Підготовка файлів

Переконайтесь, що у вас є файл `getStatistics.js` у папці `cloud-functions/`.

## Крок 2: Деплой через Google Cloud Console

### Варіант А: Через Google Cloud Console (візуальний редактор)

1. **Відкрийте Google Cloud Console:**
   - Перейдіть на https://console.cloud.google.com/
   - Оберіть проект `okolovision-48840`

2. **Створіть нову функцію:**
   - У меню зліва перейдіть до **Cloud Functions** (або **Cloud Run** → **Functions**)
   - Натисніть кнопку **"Write a function"** (або **"+ Create function"**)

3. **Налаштування основної інформації:**
   ```
   Function name: getStatistics
   Region: us-central1 (або europe-west1, якщо інші функції там)
   Runtime: Node.js 20
   Entry point: getStatistics
   ```

4. **Налаштування тригера:**
   - **Authentication:** Public access (Allow unauthenticated invocations)
   - **Require HTTPS:** Yes

5. **Налаштування коду:**
   - **Source code:** Inline editor
   - Скопіюйте весь вміст файлу `cloud-functions/getStatistics.js` у редактор

6. **Додайте залежності (package.json):**
   - На вкладці **Dependencies** або в самому коді додайте секцію, якщо її немає
   - Переконайтесь, що є такі залежності:
   ```json
   {
     "dependencies": {
       "firebase-functions": "^4.x.x",
       "firebase-admin": "^12.x.x",
       "cors": "^2.8.5"
     }
   }
   ```

7. **Environment variables (за потреби):**
   - Зазвичай не потрібні, якщо використовуєте `applicationDefault()`

8. **Налаштування пам'яті та таймаутів:**
   - **Memory:** 256 MB (мінімум, можна збільшити до 512 MB для більших об'ємів)
   - **Timeout:** 60s (або більше, якщо користувачів багато)

9. **Deploy:**
   - Натисніть **"Deploy"** або **"Save"**
   - Дочекайтесь завершення деплою (зазвичай 2-5 хвилин)

10. **Отримайте URL:**
    - Після деплою скопіюйте URL функції
    - Він буде виглядати так: `https://us-central1-okolovision-48840.cloudfunctions.net/getStatistics`
    - АБО для Cloud Run (2nd gen): `https://getstatistics-xxxxxxxxx-ew.a.run.app`

---

### Варіант Б: Через Firebase CLI (якщо є налаштований проект)

1. **Переконайтесь, що у вас є Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Створіть структуру проекту:**
   ```
   your-project/
   ├── functions/
   │   ├── index.js
   │   └── package.json
   └── firebase.json
   ```

3. **Скопіюйте код:**
   - Скопіюйте вміст `getStatistics.js` у `functions/index.js`
   - Експортуйте функцію:
   ```javascript
   exports.getStatistics = functions.https.onRequest((request, response) => {
     // ваш код
   })
   ```

4. **package.json для functions:**
   ```json
   {
     "name": "functions",
     "description": "Cloud Functions for Firebase",
     "scripts": {
       "lint": "eslint .",
       "serve": "firebase emulators:start --only functions",
       "shell": "firebase functions:shell",
       "start": "npm run shell",
       "deploy": "firebase deploy --only functions",
       "logs": "firebase functions:log"
     },
     "engines": {
       "node": "20"
     },
     "main": "index.js",
     "dependencies": {
       "firebase-admin": "^12.0.0",
       "firebase-functions": "^4.5.0",
       "cors": "^2.8.5"
     },
     "devDependencies": {
       "eslint": "^8.15.0"
     },
     "private": true
   }
   ```

5. **Деплой:**
   ```bash
   cd functions
   npm install
   firebase deploy --only functions:getStatistics
   ```

---

## Крок 3: Оновлення фронтенду

Після успішного деплою оновіть URL у файлі `src/pages/statistics.vue`:

```typescript
// Замініть цей рядок:
const CF_STATISTICS = 'https://us-central1-okolovision-48840.cloudfunctions.net/getStatistics'

// АБО для Cloud Run (2nd gen):
const CF_STATISTICS = 'https://getstatistics-xxxxxxxxx-ew.a.run.app'
```

---

## Крок 4: Перевірка роботи

1. **Тест через браузер або Postman:**
   ```
   POST https://us-central1-okolovision-48840.cloudfunctions.net/getStatistics
   Headers:
     Content-Type: application/json
   Body:
   {
     "filters": {
       "includeClinic": true
     }
   }
   ```

2. **Перевірте сторінку статистики:**
   - Відкрийте `/statistics` у вашому додатку
   - Перевірте, чи завантажується статистика
   - Перевірте консоль браузера на наявність помилок

---

## Можливі проблеми та рішення

### Помилка: "CORS policy"
- **Рішення:** Переконайтесь, що CORS налаштований у функції (`cors(request, response, async () => {...})`)

### Помилка: "Permission denied"
- **Рішення:** Переконайтесь, що функція має права на читання з Firestore
- Перевірте Service Account функції

### Помилка: "Function execution took too long"
- **Рішення:** Збільште timeout у налаштуваннях функції або оптимізуйте запити до Firestore

### Помилка: "Memory limit exceeded"
- **Рішення:** Збільште пам'ять функції (512 MB або 1 GB)

---

## Структура відповіді API

Функція повертає JSON у такому форматі:

```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "binocularStats": {
      "binocular": 60,
      "monocular": 40
    },
    "ageStats": [
      {
        "age": 6,
        "binocular": 10,
        "monocular": 5,
        "total": 15
      }
    ],
    "gameStats": {
      "total": [...],
      "binocular": [...],
      "monocular": [...]
    },
    "playTimeStats": {
      "totalAverageMinutes": 120.5,
      "averagePerDay": 15.3,
      "usersCount": 50
    },
    "unknownBirthdayFormats": []
  },
  "filters": {...}
}
```

---

## Важливо

- **Region:** Оберіть той самий регіон, що й інші ваші функції (`us-central1` або `europe-west1`)
- **Entry point:** Має збігатися з ім'ям експорту (`getStatistics`)
- **Timeout:** Для великої кількості користувачів може знадобитися більший timeout (до 540s)
- **Memory:** Для великої кількості даних рекомендується 512 MB або більше
