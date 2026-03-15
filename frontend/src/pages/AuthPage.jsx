function AuthPage({
  authForm,
  authMode,
  errorMessage,
  isLoading,
  message,
  setAuthMode,
  submitAuth,
  updateAuthField,
}) {
  return (
    <div className="auth-shell">
      <section className="auth-card auth-card--intro">
        <p className="auth-kicker">Pink task flow</p>
        <h1>Sign in to your task workspace</h1>
        <p className="auth-copy">
          A dedicated login page unlocks your task list, validity deadlines, and full task
          descriptions.
        </p>
        <div className="auth-highlights">
          <div>
            <strong>Separate page</strong>
            <span>Clean sign-in flow without mixing tasks and service blocks.</span>
          </div>
          <div>
            <strong>Quick transition</strong>
            <span>After sign-in, users are redirected straight to their tasks page.</span>
          </div>
          <div>
            <strong>Pink-first theme</strong>
            <span>The new palette makes the interface softer and more cohesive.</span>
          </div>
        </div>
      </section>

      <section className="auth-card auth-card--form">
        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
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

        <div className="auth-heading">
          <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p>
            {authMode === 'login'
              ? 'Enter your credentials to open the tasks page.'
              : 'After registration you will be redirected to tasks automatically.'}
          </p>
        </div>

        <form className="form" onSubmit={submitAuth}>
          <label>
            Username
            <input
              value={authForm.username}
              onChange={(event) => updateAuthField('username', event.target.value)}
              placeholder="anna"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={authForm.password}
              onChange={(event) => updateAuthField('password', event.target.value)}
              placeholder="password"
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
                placeholder="anna@example.com"
              />
            </label>
          ) : null}

          <button className="primary auth-submit" disabled={isLoading} type="submit">
            {isLoading
              ? 'Please wait...'
              : authMode === 'login'
                ? 'Sign in and open tasks'
                : 'Create account'}
          </button>
        </form>

        {message ? <div className="message ok">{message}</div> : null}
        {errorMessage ? <div className="message error">{errorMessage}</div> : null}
      </section>
    </div>
  )
}

export default AuthPage
