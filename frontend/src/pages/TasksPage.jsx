function formatDeadline(value) {
  if (!value) {
    return 'No deadline'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function TasksPage({
  editingTaskId,
  errorMessage,
  fetchTasks,
  isLoading,
  isRefreshing,
  message,
  onEditTask,
  onLogout,
  onRefreshTokens,
  onRemoveTask,
  onSaveTask,
  onSelectTask,
  onToggleTask,
  resetTaskEditor,
  selectedTaskId,
  session,
  taskForm,
  tasks,
  updateTaskField,
}) {
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null

  return (
    <div className="tasks-shell page">
      <header className="tasks-hero panel panel--hero">
        <div>
          <p className="eyebrow">Task lounge</p>
          <h1>Tasks and details in one place</h1>
          <p className="hero-copy">
            After sign-in, users land on a dedicated tasks page. Each card shows its validity
            deadline, and clicking a card reveals the full long description.
          </p>
        </div>

        <div className="hero-actions">
          <div className="profile-pill">
            <span className="profile-label">Profile</span>
            <strong>{session.username}</strong>
          </div>
          <button type="button" onClick={() => onRefreshTokens().catch(() => {})}>
            {isRefreshing ? 'Refreshing token...' : 'Refresh token'}
          </button>
          <button type="button" className="ghost" onClick={() => onLogout(true)}>
            Logout
          </button>
        </div>
      </header>

      <main className="tasks-layout">
        <section className="panel panel--form">
          <div className="panel-head">
            <div>
              <p className="section-label">Editor</p>
              <h2>{editingTaskId ? 'Edit task' : 'New task'}</h2>
            </div>
            <button type="button" className="ghost" onClick={() => fetchTasks()} disabled={isLoading}>
              Reload list
            </button>
          </div>

          <form className="task-form" onSubmit={onSaveTask}>
            <label>
              Title
              <input
                value={taskForm.topic}
                onChange={(event) => updateTaskField('topic', event.target.value)}
                placeholder="Prepare product demo"
                required
              />
            </label>

            <div className="row two-col">
              <label>
                Priority
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={taskForm.importance}
                  onChange={(event) => updateTaskField('importance', event.target.value)}
                />
              </label>

              <label>
                Valid until
                <input
                  type="datetime-local"
                  value={taskForm.deadline}
                  onChange={(event) => updateTaskField('deadline', event.target.value)}
                />
              </label>
            </div>

            <label>
              Short description
              <input
                value={taskForm.shortDescription}
                onChange={(event) => updateTaskField('shortDescription', event.target.value)}
                placeholder="Collect final slides"
              />
            </label>

            <label>
              Long description
              <textarea
                value={taskForm.longDescription}
                onChange={(event) => updateTaskField('longDescription', event.target.value)}
                rows="5"
                placeholder="Task details, requirements, steps, and clarifications"
              />
            </label>

            <div className="task-actions">
              <button type="submit" className="primary" disabled={isLoading}>
                {editingTaskId ? 'Save changes' : 'Create task'}
              </button>
              {editingTaskId ? (
                <button type="button" onClick={resetTaskEditor}>
                  Cancel editing
                </button>
              ) : null}
            </div>
          </form>

          {message ? <div className="message ok">{message}</div> : null}
          {errorMessage ? <div className="message error">{errorMessage}</div> : null}
        </section>

        <section className="panel panel--list">
          <div className="panel-head">
            <div>
              <p className="section-label">List</p>
              <h2>Active tasks</h2>
            </div>
            <span className="chip">{tasks.length} items</span>
          </div>

          <div className="task-list">
            {tasks.length ? (
              tasks.map((task) => (
                <article
                  key={task.id}
                  className={`task-card ${task.id === selectedTaskId ? 'selected' : ''} ${task.complete ? 'done' : ''}`}
                  onClick={() => onSelectTask(task.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelectTask(task.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="task-card-top">
                    <h3>{task.topic}</h3>
                    <span className={`state-badge ${task.complete ? 'done' : 'active'}`}>
                      {task.complete ? 'Done' : 'In progress'}
                    </span>
                  </div>

                  <p className="task-summary">{task.shortDescription || 'Click to open the full description.'}</p>
                  <p className="task-deadline">Valid until: {formatDeadline(task.deadline)}</p>

                  <div className="task-meta-row">
                    <span>Priority: {task.importance ?? '-'}</span>
                    <div className="task-item-actions">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onToggleTask(task.id)
                        }}
                      >
                        Toggle
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onEditTask(task)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={(event) => {
                          event.stopPropagation()
                          onRemoveTask(task.id)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <h3>No tasks yet</h3>
                <p>Create your first task and it will appear here with deadline and full description.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="panel panel--details">
          <div className="panel-head">
            <div>
              <p className="section-label">Details</p>
              <h2>{selectedTask ? selectedTask.topic : 'Select a task'}</h2>
            </div>
            {selectedTask ? <span className="chip">ID {selectedTask.id}</span> : null}
          </div>

          {selectedTask ? (
            <div className="details-body">
              <div className="details-grid">
                <div className="details-stat">
                  <span>Status</span>
                  <strong>{selectedTask.complete ? 'Completed' : 'Active'}</strong>
                </div>
                <div className="details-stat">
                  <span>Priority</span>
                  <strong>{selectedTask.importance ?? '-'}</strong>
                </div>
                <div className="details-stat details-stat--wide">
                  <span>Validity deadline</span>
                  <strong>{formatDeadline(selectedTask.deadline)}</strong>
                </div>
              </div>

              <div className="details-section">
                <h3>Short description</h3>
                <p>{selectedTask.shortDescription || 'Short description is not provided.'}</p>
              </div>

              <div className="details-section details-section--accent">
                <h3>Long description</h3>
                <p>{selectedTask.longDescription || 'Long description is not added yet.'}</p>
              </div>
            </div>
          ) : (
            <div className="empty-state empty-state--details">
              <h3>No selected task</h3>
              <p>Click any task card to see its long description and validity deadline.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  )
}

export default TasksPage
