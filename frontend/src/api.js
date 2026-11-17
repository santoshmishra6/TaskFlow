import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 10000,
})

export async function getTasks() {
  const { data } = await api.get('/tasks')
  return data.data ?? data
}
export async function createTask(payload) {
  const { data } = await api.post('/tasks', payload)
  return data.data ?? data
}
export async function updateTask(id, payload) {
  const { data } = await api.patch(`/tasks/${id}`, payload)
  return data.data ?? data
}
export async function getProjects() {
  const { data } = await api.get('/projects')
  return data.data ?? data
}
export default api
