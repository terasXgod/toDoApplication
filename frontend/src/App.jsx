import { useEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AuthPage from './pages/AuthPage.jsx'
import TasksPage from './pages/TasksPage.jsx'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const STORAGE_KEY = 'todo-jwt-session'

const EMPTY_FORM = {
  topic: '',
  shortDescription: '',
  longDescription: '',
  importance: 5,
  deadline: '',
}

function normalizeToken(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().replace(/^Bearer\s+/i, '')
}

function readStoredSession() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return { username: '', accessToken: '', refreshToken: '' }
  }

  try {
    const parsed = JSON.parse(raw)
    return {
      username: parsed.username ?? '',
      accessToken: normalizeToken(parsed.accessToken),
      refreshToken: normalizeToken(parsed.refreshToken),
    }
  } catch {
    return { username: '', accessToken: '', refreshToken: '' }
  }
}

function writeStoredSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY)
}

function findTokenValue(source, keys) {
  if (!source || typeof source !== 'object') {
    return ''
  }

  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) {
      const normalized = normalizeToken(value)
      if (normalized) {
        return normalized
      }
    }
  }

  for (const value of Object.values(source)) {
    if (value && typeof value === 'object') {
      const nested = findTokenValue(value, keys)
      if (nested) {
        return nested
      }
    }
  }

  return ''
}

function findJwtByShape(source) {
  if (!source || typeof source !== 'object') {
    return ''
  }

  const jwtShape = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/

  for (const value of Object.values(source)) {
    if (typeof value === 'string') {
      const normalized = normalizeToken(value)
      if (jwtShape.test(normalized)) {
        return normalized
      }
    }

    if (value && typeof value === 'object') {
      const nested = findJwtByShape(value)
      if (nested) {
        return nested
      }
    }
  }

  return ''
}

function extractTokens(payload, headers) {
  const headerAccessToken = normalizeToken(
    headers?.get('Authorization') ?? headers?.get('authorization') ?? headers?.get('X-Auth-Token') ?? '',
  )
  const headerRefreshToken = normalizeToken(
    headers?.get('X-Refresh-Token') ?? headers?.get('x-refresh-token') ?? '',
  )

  if (!payload || typeof payload !== 'object') {
    return { accessToken: headerAccessToken, refreshToken: headerRefreshToken }
  }

  const accessToken = findTokenValue(payload, [
    'accessToken',
    'access_token',
    'token',
    'jwt',
    'access',
    'accessJwt',
  ]) || headerAccessToken || findJwtByShape(payload)

  const refreshToken = findTokenValue(payload, [
    'refreshToken',
    'refresh_token',
    'refresh',
    'refreshJwt',
  ]) || headerRefreshToken

  return { accessToken, refreshToken }
}

function normalizeTaskList(payload) {
  if (Array.isArray(payload)) {
    return payload
  }
  if (Array.isArray(payload?.content)) {
    return payload.content
  }
  return []
}

function normalizeDateTimeLocal(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

function createRequestBody(taskForm) {
  const body = {
    topic: taskForm.topic.trim(),
    importance: Number(taskForm.importance),
  }

  if (taskForm.shortDescription.trim()) {
    body.shortDescription = taskForm.shortDescription.trim()
  }
  if (taskForm.longDescription.trim()) {
    body.longDescription = taskForm.longDescription.trim()
  }
  if (taskForm.deadline) {
    body.deadline = new Date(taskForm.deadline).toISOString()
  }

  return body
}

function App() {
  const [tasks, setTasks] = useState([])
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [authForm, setAuthForm] = useState({
    username: '',
    password: '',
    email: '',
  })
  const [session, setSession] = useState(() => readStoredSession())
  const [taskForm, setTaskForm] = useState(EMPTY_FORM)
  const [editingTaskId, setEditingTaskId] = useState(null)

  const refreshPromiseRef = useRef(null)
  const isLoggedIn = Boolean(session.accessToken)

  useEffect(() => {
    if (isLoggedIn) {
      void fetchTasks()
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (!tasks.length) {
      setSelectedTaskId(null)
      return
    }

    setSelectedTaskId((currentId) =>
      tasks.some((task) => task.id === currentId) ? currentId : tasks[0].id,
    )
  }, [tasks])

  const clearMessages = () => {
    setErrorMessage('')
    setMessage('')
  }

  const updateAuthField = (field, value) => {
    setAuthForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateTaskField = (field, value) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }))
  }

  const persistSession = (nextSession) => {
    const normalizedSession = {
      username: nextSession.username ?? '',
      accessToken: normalizeToken(nextSession.accessToken),
      refreshToken: normalizeToken(nextSession.refreshToken),
    }

    writeStoredSession(normalizedSession)
    setSession(normalizedSession)
  }

  const clearSessionState = () => {
    clearStoredSession()
    setSession({ username: '', accessToken: '', refreshToken: '' })
  }

  const getSessionTokens = () => {
    const storedSession = readStoredSession()

    return {
      accessToken: normalizeToken(session.accessToken) || storedSession.accessToken,
      refreshToken: normalizeToken(session.refreshToken) || storedSession.refreshToken,
    }
  }

  const withAuthHeaders = (headers = {}, token) => {
    const normalized = normalizeToken(token)

    if (!normalized) {
      return headers
    }

    return {
      ...headers,
      Authorization: `Bearer ${normalized}`,
    }
  }

  const resetTaskEditor = () => {
    setEditingTaskId(null)
    setTaskForm(EMPTY_FORM)
  }

  const logout = async (callApi = true) => {
    const { accessToken, refreshToken } = getSessionTokens()

    if (callApi && (refreshToken || accessToken)) {
      const tokenForLogout = refreshToken || accessToken

      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: withAuthHeaders({}, tokenForLogout),
        })
      } catch {
        // Local logout should still work if the backend is unavailable.
      }
    }

    clearSessionState()
    setTasks([])
    setSelectedTaskId(null)
    clearMessages()
    resetTaskEditor()
  }

  const refreshTokens = async () => {
    const { refreshToken: currentRefreshToken } = getSessionTokens()

    if (!currentRefreshToken) {
      throw new Error('Refresh token is missing')
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const refreshFlow = (async () => {
      setIsRefreshing(true)
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: withAuthHeaders({}, currentRefreshToken),
      })

      if (!response.ok) {
        throw new Error('Unable to refresh token')
      }

      const payload = await response.json()
      const { accessToken, refreshToken } = extractTokens(payload, response.headers)

      if (!accessToken) {
        throw new Error('Refresh response does not contain access token')
      }

      const storedSession = readStoredSession()
      persistSession({
        username: session.username || storedSession.username,
        accessToken,
        refreshToken: refreshToken || session.refreshToken || storedSession.refreshToken,
      })

      return accessToken
    })()

    refreshPromiseRef.current = refreshFlow

    try {
      return await refreshFlow
    } finally {
      refreshPromiseRef.current = null
      setIsRefreshing(false)
    }
  }

  const apiRequest = async (path, options = {}, allowRefresh = true) => {
    const { accessToken, refreshToken } = getSessionTokens()

    if (!accessToken) {
      throw new Error('Missing access token. Please sign in again.')
    }

    const headers = withAuthHeaders(options.headers ?? {}, accessToken)

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })

    if (response.status === 401 && allowRefresh && refreshToken) {
      try {
        const freshAccessToken = await refreshTokens()
        const retryHeaders = withAuthHeaders(options.headers ?? {}, freshAccessToken)

        return fetch(`${API_BASE}${path}`, {
          ...options,
          headers: retryHeaders,
        })
      } catch {
        await logout(false)
        throw new Error('Session expired. Please sign in again.')
      }
    }

    return response
  }

  const fetchTasks = async () => {
    setIsLoading(true)

    try {
      const response = await apiRequest('/tasks?page=0&size=20&sort=createDate,desc')
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Unable to load tasks')
      }

      const payload = await response.json()
      setTasks(normalizeTaskList(payload))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const submitAuth = async (event) => {
    event.preventDefault()
    clearMessages()
    setIsLoading(true)

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register'
      const body = {
        username: authForm.username,
        password: authForm.password,
        ...(authMode === 'register' && authForm.email ? { email: authForm.email } : {}),
      }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Authentication failed')
      }

      const payload = await response.json()
      const { accessToken, refreshToken } = extractTokens(payload, response.headers)

      if (!accessToken) {
        throw new Error('No access token in response. Check backend JWT payload keys.')
      }

      persistSession({
        username: authForm.username,
        accessToken,
        refreshToken,
      })

      setMessage(authMode === 'login' ? 'Signed in successfully.' : 'Account created and signed in.')
      setAuthForm((prev) => ({ ...prev, password: '' }))
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const saveTask = async (event) => {
    event.preventDefault()
    clearMessages()

    if (!taskForm.topic.trim()) {
      setErrorMessage('Task title is required')
      return
    }

    const body = createRequestBody(taskForm)
    const isEditing = editingTaskId !== null
    const path = isEditing ? `/tasks/${editingTaskId}` : '/tasks'
    const method = isEditing ? 'PUT' : 'POST'

    try {
      setIsLoading(true)
      const response = await apiRequest(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Unable to save task')
      }

      await fetchTasks()
      resetTaskEditor()
      setMessage(isEditing ? 'Task updated.' : 'Task created.')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const editTask = (task) => {
    setEditingTaskId(task.id)
    setSelectedTaskId(task.id)
    setTaskForm({
      topic: task.topic ?? '',
      shortDescription: task.shortDescription ?? '',
      longDescription: task.longDescription ?? '',
      importance: task.importance ?? 5,
      deadline: normalizeDateTimeLocal(task.deadline),
    })
  }

  const removeTask = async (id) => {
    clearMessages()

    try {
      setIsLoading(true)
      const response = await apiRequest(`/tasks/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Unable to delete task')
      }

      setTasks((prev) => prev.filter((task) => task.id !== id))
      setMessage('Task deleted.')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTask = async (id) => {
    clearMessages()

    try {
      const response = await apiRequest(`/tasks/${id}/toggle`, { method: 'PATCH' })
      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || 'Unable to toggle task')
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? {
                ...task,
                complete: !task.complete,
              }
            : task,
        ),
      )
    } catch (error) {
      setErrorMessage(error.message)
    }
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isLoggedIn ? '/tasks' : '/auth'} replace />}
      />
      <Route
        path="/auth"
        element={
          isLoggedIn ? (
            <Navigate to="/tasks" replace />
          ) : (
            <AuthPage
              authForm={authForm}
              authMode={authMode}
              errorMessage={errorMessage}
              isLoading={isLoading}
              message={message}
              setAuthMode={setAuthMode}
              submitAuth={submitAuth}
              updateAuthField={updateAuthField}
            />
          )
        }
      />
      <Route
        path="/tasks"
        element={
          isLoggedIn ? (
            <TasksPage
              editingTaskId={editingTaskId}
              errorMessage={errorMessage}
              fetchTasks={fetchTasks}
              isLoading={isLoading}
              isRefreshing={isRefreshing}
              message={message}
              onEditTask={editTask}
              onLogout={logout}
              onRefreshTokens={refreshTokens}
              onRemoveTask={removeTask}
              onSaveTask={saveTask}
              onSelectTask={setSelectedTaskId}
              onToggleTask={toggleTask}
              resetTaskEditor={resetTaskEditor}
              selectedTaskId={selectedTaskId}
              session={session}
              taskForm={taskForm}
              tasks={tasks}
              updateTaskField={updateTaskField}
            />
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
