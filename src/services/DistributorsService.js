// src/services/DistributorsService.js
import { CLOUD_FUNCTIONS } from "@/utils/cloudFunctions"
import axios from "axios"

const API_URL = CLOUD_FUNCTIONS.ADMIN_DISTRIBUTORS

export default {
  async list() {
    const res = await axios.post(API_URL, { action: "list" })
    
    return res.data.data || []
  },

  async get(id) {
    const res = await axios.post(API_URL, { action: "get", id })
    
    return res.data.data || null
  },

  async create(payload) {
    const res = await axios.post(API_URL, { action: "create", data: payload })
    
    return res.data.id
  },

  async update(id, payload) {
    await axios.post(API_URL, { action: "update", id, data: payload })
    
    return true
  },
}
