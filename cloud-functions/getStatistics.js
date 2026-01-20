const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')({ origin: true })

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://okolovision-48840-default-rtdb.europe-west1.firebasedatabase.app",
  })
}

// Мапа назв ігор (та сама що на фронті)
const gameNames = {
  "a727cd04-7f77-47a0-86c8-38e57e11f84b": "Дорога тварин",
  "6d24ce1e-1017-48a3-b6f6-082979e2aaba": "Космічна куля",
  "39615c8e-4575-4d45-adc9-8aa04de879ac": "Хрестики",
  "cbb292d7-68a3-41f2-b20b-487d20c9153f": "Тандем",
  "4f5dd55a-bd2f-4fc6-b44d-6d66cfaba210": "Полювання на качок",
  "905096b1-af85-4f8e-acaf-7671627ad20d": "Фузія гоу +",
  "65917f06-8102-4a45-8f0f-67d64e043564": "Фузія гоу -",
  "d6a28af8-cf9c-4069-ab99-93df2131e89d": "Фузія гоу",
  "a086ab0b-384b-4e97-8b06-fd841890e89a": "Фузія Дуо",
  "2c22657b-5a2a-4b26-891f-d178a8825e75": "Автомагістраль +",
  "a330cdaf-e25d-4595-9c85-6d7f8d8adb3a": "Автомагістраль -",
  "245a4077-e116-4348-939b-23f21f8763ca": "Вище хмар",
  "c7894e9a-a734-41bc-8d4c-90df35942130": "Магічні фрукти",
  "9b50f940-5679-4fd8-a58b-3f6809343428": "Пазли",
  "2a9419f0-b096-427a-9be3-295de05f50da": "Маріо",
  "9386aaf0-27c0-4ccb-a08f-fa6e01d6cc16": "Формоленд",
  "e3d606be-89df-4090-8246-676ceba47098": "Павучок",
  "5739dd72-a73f-4d5c-a96a-3a9034d33a4f": "Тетріс",
  "fd5bcdea-8aa8-4938-8c65-8c7d0cddfd86": "Твістерс",
}

// Функція для обчислення віку з birthday
function calculateAge(birthday) {
  if (!birthday) return null
    
  try {
    const birthdayStr = String(birthday).trim()
        
    // Формат "dd-MMMM-yyyy" (українська назва місяця)
    // Приклад: "22-Квітень-2010"
    const monthNamesUk = {
      'січень': 1, 'лютий': 2, 'березень': 3, 'квітень': 4,
      'травень': 5, 'червень': 6, 'липень': 7, 'серпень': 8,
      'вересень': 9, 'жовтень': 10, 'листопад': 11, 'грудень': 12,
    }
        
    const matchUk = birthdayStr.match(/^(\d{2})-([А-Яа-яІіЇїЄєЁё]+)-(\d{4})$/)
    if (matchUk) {
      const [, day, monthName, year] = matchUk
      const month = monthNamesUk[monthName.toLowerCase()]
      if (month) {
        const birthDate = new Date(parseInt(year), month - 1, parseInt(day))
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--
        }
        
        return age
      }
    }
        
    // Формат ISO або інші стандартні
    const date = new Date(birthdayStr)
    if (!isNaN(date.getTime())) {
      const today = new Date()
      let age = today.getFullYear() - date.getFullYear()
      const monthDiff = today.getMonth() - date.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--
      }
      
      return age
    }
        
    // Логуємо невідомий формат для аналізу
    console.log('⚠️ Unknown birthday format:', birthdayStr)
    
    return null
  } catch (error) {
    console.error('Error calculating age:', error, 'birthday:', birthday)
    
    return null
  }
}

// Функція для обчислення сумарного та середнього часу гри
function calculatePlayTime(dailyPlayTimes) {
  if (!dailyPlayTimes || typeof dailyPlayTimes !== 'object') {
    return { totalMinutes: 0, averagePerDay: 0, daysCount: 0 }
  }
    
  const times = Object.values(dailyPlayTimes).map(v => Number(v) || 0)
  const totalMinutes = times.reduce((sum, val) => sum + val, 0)
  const daysCount = times.filter(v => v > 0).length
  const averagePerDay = daysCount > 0 ? totalMinutes / daysCount : 0
    
  return {
    totalMinutes: Math.round(totalMinutes * 100) / 100,
    averagePerDay: Math.round(averagePerDay * 100) / 100,
    daysCount,
  }
}

exports.getStatistics = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const filters = request.body?.filters || {}

      const {
        ageFrom = null,
        ageTo = null,
        gender = null, // 'Male', 'Female', 'Not specified', або null (всі)
        isActive = null, // true, false, або null (всі)
        includeClinic = true, // true - включає клініки, false - виключає
      } = filters

      console.log('📊 Fetching statistics with filters:', filters)

      // Отримуємо всіх користувачів
      const usersSnapshot = await admin.firestore().collection('users').get()
      const allUsers = []
      const unknownBirthdayFormats = new Set()

      usersSnapshot.forEach(doc => {
        const userData = doc.data()
                
        // Фільтр isClinic
        if (includeClinic === false && (userData.isClinic === true)) {
          return // Пропускаємо клініки
        }
                
        // Фільтр gender
        if (gender !== null && userData.gender !== gender) {
          return
        }
                
        // Фільтр isActive
        if (isActive !== null && userData.subscription?.isActive !== isActive) {
          return
        }
                
        // Обчислюємо вік
        const age = calculateAge(userData.birthday)
                
        // Логуємо невідомі формати
        if (age === null && userData.birthday) {
          unknownBirthdayFormats.add(userData.birthday)
        }
                
        // Фільтр по віку
        if (ageFrom !== null && (age === null || age < ageFrom)) {
          return
        }
        if (ageTo !== null && (age === null || age > ageTo)) {
          return
        }
                
        allUsers.push({
          ...userData,
          id: doc.id,
          age,
        })
      })

      console.log(`✅ Found ${allUsers.length} users matching filters`)

      // Статистика по віку та режиму (бінокуляр/монокуляр)
      const ageStats = {}
      const binocularStats = { binocular: 0, monocular: 0 }
            
      // Статистика по іграх (загальна та по режимах)
      const gameStatsTotal = {}
      const gameStatsBinocular = {}
      const gameStatsMonocular = {}
            
      // Статистика часу гри
      let totalPlayTime = 0
      let totalAveragePlayTime = 0
      let usersWithPlayTime = 0

      allUsers.forEach(user => {
        // Розподіл по віку
        if (user.age !== null) {
          if (!ageStats[user.age]) {
            ageStats[user.age] = { binocular: 0, monocular: 0, total: 0 }
          }
                    
          const isBinocular = user.settings?.isBinocularMode === true
          if (isBinocular) {
            ageStats[user.age].binocular++
            binocularStats.binocular++
          } else {
            ageStats[user.age].monocular++
            binocularStats.monocular++
          }
          ageStats[user.age].total++
        }
                
        // Розподіл по режиму
        const isBinocular = user.settings?.isBinocularMode === true
        if (isBinocular) {
          binocularStats.binocular++
        } else {
          binocularStats.monocular++
        }
                
        // Статистика по іграх
        const gameRecords = user.gameRecords || {}

        Object.keys(gameRecords).forEach(gameId => {
          const gameData = gameRecords[gameId]
          const attempts = Number(gameData?.attempts || 0)
                    
          if (attempts > 0) {
            // Загальна статистика
            if (!gameStatsTotal[gameId]) {
              gameStatsTotal[gameId] = { attempts: 0, name: gameNames[gameId] || gameId }
            }
            gameStatsTotal[gameId].attempts += attempts
                        
            // Статистика по режимах
            if (isBinocular) {
              if (!gameStatsBinocular[gameId]) {
                gameStatsBinocular[gameId] = { attempts: 0, name: gameNames[gameId] || gameId }
              }
              gameStatsBinocular[gameId].attempts += attempts
            } else {
              if (!gameStatsMonocular[gameId]) {
                gameStatsMonocular[gameId] = { attempts: 0, name: gameNames[gameId] || gameId }
              }
              gameStatsMonocular[gameId].attempts += attempts
            }
          }
        })
                
        // Статистика часу гри
        const playTime = calculatePlayTime(user.dailyPlayTimes)
        if (playTime.daysCount > 0) {
          totalPlayTime += playTime.totalMinutes
          totalAveragePlayTime += playTime.averagePerDay
          usersWithPlayTime++
        }
      })

      // Обчислюємо загальну кількість спроб для відсотків
      const totalAttempts = Object.values(gameStatsTotal).reduce((sum, game) => sum + game.attempts, 0)
      const totalAttemptsBinocular = Object.values(gameStatsBinocular).reduce((sum, game) => sum + game.attempts, 0)
      const totalAttemptsMonocular = Object.values(gameStatsMonocular).reduce((sum, game) => sum + game.attempts, 0)

      // Додаємо відсотки до статистики ігор
      Object.keys(gameStatsTotal).forEach(gameId => {
        gameStatsTotal[gameId].percentage = totalAttempts > 0 
          ? Math.round((gameStatsTotal[gameId].attempts / totalAttempts) * 100 * 100) / 100 
          : 0
      })
            
      Object.keys(gameStatsBinocular).forEach(gameId => {
        gameStatsBinocular[gameId].percentage = totalAttemptsBinocular > 0 
          ? Math.round((gameStatsBinocular[gameId].attempts / totalAttemptsBinocular) * 100 * 100) / 100 
          : 0
      })
            
      Object.keys(gameStatsMonocular).forEach(gameId => {
        gameStatsMonocular[gameId].percentage = totalAttemptsMonocular > 0 
          ? Math.round((gameStatsMonocular[gameId].attempts / totalAttemptsMonocular) * 100 * 100) / 100 
          : 0
      })

      // Сортуємо ігри за популярністю (по спробах)
      const sortedGamesTotal = Object.entries(gameStatsTotal)
        .sort((a, b) => b[1].attempts - a[1].attempts)
        .slice(0, 10) // Топ 10
            
      const sortedGamesBinocular = Object.entries(gameStatsBinocular)
        .sort((a, b) => b[1].attempts - a[1].attempts)
        .slice(0, 10)
            
      const sortedGamesMonocular = Object.entries(gameStatsMonocular)
        .sort((a, b) => b[1].attempts - a[1].attempts)
        .slice(0, 10)

      // Формуємо дані для графіків
      const ageChartData = Object.entries(ageStats)
        .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
        .map(([age, stats]) => ({
          age: parseInt(age),
          binocular: stats.binocular,
          monocular: stats.monocular,
          total: stats.total,
        }))

      // Середній час гри
      const averagePlayTimeStats = usersWithPlayTime > 0 ? {
        totalAverageMinutes: Math.round((totalPlayTime / usersWithPlayTime) * 100) / 100,
        averagePerDay: Math.round((totalAveragePlayTime / usersWithPlayTime) * 100) / 100,
        usersCount: usersWithPlayTime,
      } : { totalAverageMinutes: 0, averagePerDay: 0, usersCount: 0 }

      // Логуємо невідомі формати birthday
      if (unknownBirthdayFormats.size > 0) {
        console.log('⚠️ Unknown birthday formats found:', Array.from(unknownBirthdayFormats))
      }

      return response.status(200).json({
        success: true,
        data: {
          totalUsers: allUsers.length,
          binocularStats,
          ageStats: ageChartData,
          gameStats: {
            total: sortedGamesTotal.map(([id, data]) => ({ id, ...data })),
            binocular: sortedGamesBinocular.map(([id, data]) => ({ id, ...data })),
            monocular: sortedGamesMonocular.map(([id, data]) => ({ id, ...data })),
          },
          playTimeStats: averagePlayTimeStats,
          unknownBirthdayFormats: Array.from(unknownBirthdayFormats),
        },
        filters,
      })
    } catch (error) {
      console.error('❌ Error fetching statistics:', error)
      
      return response.status(500).json({ 
        success: false, 
        message: 'Internal server error', 
        error: error.message, 
      })
    }
  })
})
