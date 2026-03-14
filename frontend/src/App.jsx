import { useEffect, useMemo, useRef, useState } from 'react'
import apiDocs from '../musor/api-docs.json'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'
const STORAGE_KEY = 'todo-jwt-session'

const METHOD_ORDER = ['get', 'post', 'put', 'patch', 'delete']

const METHOD_CLASS = {
  get: 'method-get',
  post: 'method-post',
  put: 'method-put',
  patch: 'method-patch',
  delete: 'method-delete',
}

const EMPTY_FORM = {
  topic: '',
  shortDescription: '',
  longDescription: '',
  importance: 5,
  deadline: '',
}

function extractTokens(payload) {
  if (!payload || typeof payload !== 'object') {
    return { accessToken: '', refreshToken: '' }
  }

  const accessToken =
    payload.accessToken ??
    payload.access_token ??
    payload.token ??
    payload.jwt ??
    ''

  const refreshToken =
    payload.refreshToken ?? payload.refresh_token ?? payload.refresh ?? ''

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

  const [session, setSession] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { username: '', accessToken: '', refreshToken: '' }
    }

    try {
      const parsed = JSON.parse(raw)
      return {
        username: parsed.username ?? '',
        accessToken: parsed.accessToken ?? '',
        refreshToken: parsed.refreshToken ?? '',
      }
    } catch {
      return { username: '', accessToken: '', refreshToken: '' }
    }
  })

  const [taskForm, setTaskForm] = useState(EMPTY_FORM)
  const [editingTaskId, setEditingTaskId] = useState(null)

  const refreshPromiseRef = useRef(null)
  const isLoggedIn = Boolean(session.accessToken)

  const apiRows = useMemo(() => {
    return Object.entries(apiDocs.paths)
      .flatMap(([path, handlers]) => {
        return METHOD_ORDER.filter((method) => handlers[method]).map((method) => {
          const endpoint = handlers[method]
          return {
            id: `${method}-${path}`,
            method,
            path,
            summary: endpoint.summary ?? endpoint.operationId,
            description: endpoint.description ?? '',
            operationId: endpoint.operationId,
          }
        })
      })
      .sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method))
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  }, [session])

  useEffect(() => {
    if (isLoggedIn) {
      void fetchTasks()
    }
  }, [isLoggedIn])

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

  const resetTaskEditor = () => {
    setEditingTaskId(null)
    setTaskForm(EMPTY_FORM)
  }

  const logout = async (callApi = true) => {
    if (callApi && (session.refreshToken || session.accessToken)) {
      const tokenForLogout = session.refreshToken || session.accessToken

      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenForLogout}`,
          },
        })
      } catch {
        // UI logout should still continue even if backend is not reachable.
      }
    }

    setSession({ username: '', accessToken: '', refreshToken: '' })
    setTasks([])
    resetTaskEditor()
  }

  const refreshTokens = async () => {
    if (!session.refreshToken) {
      throw new Error('Refresh token is missing')
    }

    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const refreshFlow = (async () => {
      setIsRefreshing(true)
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.refreshToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Unable to refresh token')
      }

      const payload = await response.json()
      const { accessToken, refreshToken } = extractTokens(payload)

      if (!accessToken) {
        throw new Error('Refresh response does not contain access token')
      }

      setSession((prev) => ({
        ...prev,
        accessToken,
        refreshToken: refreshToken || prev.refreshToken,
      }))

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
    const headers = {
      ...(options.headers ?? {}),
      ...(session.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })

    if (response.status === 401 && allowRefresh && session.refreshToken) {
      try {
        const freshAccessToken = await refreshTokens()
        const retryHeaders = {
          ...(options.headers ?? {}),
          Authorization: `Bearer ${freshAccessToken}`,
        }

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
      const { accessToken, refreshToken } = extractTokens(payload)

      if (!accessToken) {
        throw new Error('No access token in response. Check backend JWT payload keys.')
      }

      setSession({
        username: authForm.username,
        accessToken,
        refreshToken,
      })

      setMessage(authMode === 'login' ? 'Signed in successfully.' : 'Registered and signed in.')
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
      setErrorMessage('Topic is required')
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
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Todo API workspace</p>
        <h1>JWT-powered task command center</h1>
        <p>
          Complete frontend for your OpenAPI spec: authentication, token refresh,
          live tasks CRUD, and interactive endpoint reference.
        </p>
      </header>

      <main className="grid">
        <section className="panel auth-panel">
          <div className="panel-head">
            <h2>Authentication</h2>
            <span className={`chip ${isLoggedIn ? 'ok' : 'warn'}`}>
              {isLoggedIn ? 'Authorized' : 'Signed out'}
            </span>
          </div>

          <div className="auth-switch">
            <button
              type="button"
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              type="button"
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => setAuthMode('register')}
            >
              Register
            </button>
          </div>

          <form className="form" onSubmit={submitAuth}>
            <label>
              Username
              <input
                value={authForm.username}
                onChange={(event) => updateAuthField('username', event.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => updateAuthField('password', event.target.value)}
                required
              />
            </label>

            {authMode === 'register' ? (
              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => updateAuthField('email', event.target.value)}
                />
              </label>
            ) : null}

            <button disabled={isLoading} type="submit" className="primary">
              {isLoading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="token-box">
            <p>Access token</p>
            <code>{session.accessToken ? `${session.accessToken.slice(0, 26)}...` : 'none'}</code>
            <p>Refresh token</p>
            <code>{session.refreshToken ? `${session.refreshToken.slice(0, 26)}...` : 'none'}</code>
          </div>

          {isLoggedIn ? (
            <div className="auth-actions">
              <button type="button" onClick={() => refreshTokens().catch((e) => setErrorMessage(e.message))}>
                {isRefreshing ? 'Refreshing...' : 'Refresh token'}
              </button>
              <button type="button" className="ghost" onClick={() => logout(true)}>
                Logout
              </button>
            </div>
          ) : null}
        </section>

        <section className="panel tasks-panel">
          <div className="panel-head">
            <h2>Tasks</h2>
            <button type="button" className="ghost" onClick={() => fetchTasks()} disabled={!isLoggedIn || isLoading}>
              Reload
            </button>
          </div>

          <form className="task-form" onSubmit={saveTask}>
            <label>
              Topic
              <input
                value={taskForm.topic}
                onChange={(event) => updateTaskField('topic', event.target.value)}
                placeholder="Plan sprint demo"
                disabled={!isLoggedIn}
                required
              />
            </label>

            <div className="row two-col">
              <label>
                Importance (1-10)
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={taskForm.importance}
                  onChange={(event) => updateTaskField('importance', event.target.value)}
                  disabled={!isLoggedIn}
                />
              </label>

              <label>
                Deadline
                <input
                  type="datetime-local"
                  value={taskForm.deadline}
                  onChange={(event) => updateTaskField('deadline', event.target.value)}
                  disabled={!isLoggedIn}
                />
              </label>
            </div>

            <label>
              Short description
              <input
                value={taskForm.shortDescription}
                onChange={(event) => updateTaskField('shortDescription', event.target.value)}
                disabled={!isLoggedIn}
              />
            </label>

            <label>
              Long description
              <textarea
                value={taskForm.longDescription}
                onChange={(event) => updateTaskField('longDescription', event.target.value)}
                rows="3"
                disabled={!isLoggedIn}
              />
            </label>

            <div className="task-actions">
              <button type="submit" className="primary" disabled={!isLoggedIn || isLoading}>
                {editingTaskId ? 'Update task' : 'Create task'}
              </button>
              {editingTaskId ? (
                <button type="button" onClick={resetTaskEditor}>
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>

          {message ? <div className="message ok">{message}</div> : null}
          {errorMessage ? <div className="message error">{errorMessage}</div> : null}

          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id} className={`task-item ${task.complete ? 'done' : ''}`}>
                <div>
                  <h3>{task.topic}</h3>
                  <p>
                    Importance: {task.importance ?? '-'} | Deadline:{' '}
                    {task.deadline ? new Date(task.deadline).toLocaleString() : '-'}
                  </p>
                </div>

                <div className="task-item-actions">
                  <button type="button" onClick={() => toggleTask(task.id)} disabled={!isLoggedIn}>
                    Toggle
                  </button>
                  <button type="button" onClick={() => editTask(task)} disabled={!isLoggedIn}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => removeTask(task.id)} disabled={!isLoggedIn}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel api-panel">
          <div className="panel-head">
            <h2>OpenAPI Reference</h2>
            <span className="chip">{apiRows.length} endpoints</span>
          </div>

          <div className="api-list">
            {apiRows.map((row) => (
              <article key={row.id} className="api-row">
                <div className="api-main">
                  <span className={`method ${METHOD_CLASS[row.method]}`}>{row.method.toUpperCase()}</span>
                  <code>{row.path}</code>
                </div>
                <h3>{row.summary}</h3>
                <p>{row.description || 'No description'}</p>
                <small>operationId: {row.operationId}</small>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App