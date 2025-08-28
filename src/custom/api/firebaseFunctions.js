import axios from 'axios'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyARkaML70IyBM6RTT21cwcJ7OkOlhJwcy0',
  authDomain: 'okolovision-48840.firebaseapp.com',
  projectId: 'okolovision-48840',
}
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

export const loginUser = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password)
    return true
  } catch (e) {
    console.error(e.message)
    return false
  }
}

// export const fetchAllUsers = async () => {
//   const res = await axios.post('https://us-central1-okolovision-48840.cloudfunctions.net/adminGetAllUsers', {})
//   return res.data.data || []
// }
// export const fetchUsersPage = async (pageSize: number, pageToken: string | null) => {
//     const res = await axios.post(
//         'https://us-central1-okolovision-48840.cloudfunctions.net/adminGetAllUsers',
//         { pageSize, pageToken }
//     )
//     return {
//         data: Array.isArray(res.data?.data) ? res.data.data : [],
//         nextPageToken: res.data?.nextPageToken ?? null,
//     }
// }


export const fetchUserById = async (id) => {
  const res = await axios.post('https://us-central1-okolovision-48840.cloudfunctions.net/userGetData', { userId: id })
  return res.data.data
}

// export async function createNewUser(data) {
//   try {
//     const response = await axios.post(
//         'https://europe-west1-okolovision-48840.cloudfunctions.net/clinicCreatePatient',
//         { data }
//     )
//     return response.data
//   } catch (error) {
//     console.error('createNewUser error:', error)
//     throw error
//   }
// }

export const fetchAllPromoCodes = async () => {
    const res = await fetch(
        'https://us-central1-okolovision-48840.cloudfunctions.net/promocodeGetAll',
        { method: 'POST' }
    );

    const json = await res.json();

    if (json.success) {
        return { data: json.data, stats: json.stats };
    } else {
        throw new Error(json.message || 'Помилка отримання промокодів');
    }
};

