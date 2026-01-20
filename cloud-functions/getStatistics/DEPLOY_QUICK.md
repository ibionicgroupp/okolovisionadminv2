# Швидка інструкція з деплою getStatistics

## Структура файлів (створена):
```
cloud-functions/getStatistics/
├── firebaseAdmin.js    (ініціалізація Firebase Admin)
├── index.js            (основна логіка функції)
└── package.json        (залежності)
```

## Кроки деплою в Google Cloud Console:

### 1. Відкрийте Google Cloud Console
- Перейдіть до **Cloud Run** → **Functions**
- Натисніть **"Write a function"**

### 2. Заповніть форму:

**Basic settings:**
- **Function name:** `admingetstatisticsv2` (або `getStatistics`, якщо вже створено)
- **Region:** `us-central1` (або `europe-west1`, як у ваших інших функцій)
- **Authentication:** **Allow unauthenticated invocations** (Public access)

**Runtime settings:**
- **Runtime:** Node.js 20
- **Entry point:** `admingetstatisticsv2` (назва експорту з `exports.admingetstatisticsv2`)

### 3. Завантажте файли:

**Варіант А - Через редактор:**
- Виберіть **"Inline editor"**
- У редакторі створіть 3 файли:

**Файл 1: `firebaseAdmin.js`**
```
(Скопіюйте вміст з cloud-functions/getStatistics/firebaseAdmin.js)
```

**Файл 2: `index.js`**
```
(Скопіюйте вміст з cloud-functions/getStatistics/index.js)
```

**Файл 3: `package.json`**
```
(Скопіюйте вміст з cloud-functions/getStatistics/package.json)
```

**Варіант Б - Через ZIP:**
- Заархівуйте всі 3 файли у ZIP
- Завантажте через опцію завантаження

### 4. Налаштування:
- **Memory:** 512 MB
- **Timeout:** 60s (або 120s для великої кількості користувачів)
- **Min instances:** 0
- **Max instances:** 10

### 5. Deploy:
- Натисніть **"Deploy"**
- Дочекайтесь завершення (2-5 хвилин)

### 6. Отримайте URL:
Після деплою скопіюйте URL функції, він буде виглядати так:
```
https://us-central1-okolovision-48840.cloudfunctions.net/admingetstatisticsv2
```
АБО для Cloud Run (2nd gen):
```
https://admingetstatisticsv2-xxxxxxxxx-ew.a.run.app
```

### 7. Оновіть фронтенд:
У файлі `src/pages/statistics.vue` оновіть URL:
```typescript
const CF_STATISTICS = 'https://us-central1-okolovision-48840.cloudfunctions.net/admingetstatisticsv2'
```
АБО якщо це Cloud Run (2nd gen):
```typescript
const CF_STATISTICS = 'https://admingetstatisticsv2-xxxxxxxxx-ew.a.run.app'
```

---

## Важливо!

✅ **Entry point** має бути `admingetstatisticsv2` (назва експорту з `exports.admingetstatisticsv2 = ...`)  
✅ **Function name** може бути `admingetstatisticsv2` або інша назва (entry point важливіший)  
✅ **Region** оберіть той самий, що й інші функції (`us-central1` або `europe-west1`)  
✅ **Файли мають бути в одному каталозі** (firebaseAdmin.js, index.js, package.json)  
✅ **package.json має містити всі залежності** (firebase-admin, firebase-functions, cors)  

---

## Перевірка після деплою:

Відкрийте сторінку `/statistics` у вашому додатку і перевірте:
1. Чи завантажується статистика
2. Чи працюють фільтри
3. Чи відображаються графіки

Якщо є помилки - перевірте логи в Google Cloud Console (кнопка "Open Cloud Logging")
