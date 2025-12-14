export default function Login() {
  return (
    <div className="container login-white" style={{ maxWidth: "460px" }}>
      <div className="card gh-box">
        <div className="card-body">
          <h3 className="mb-3">Login</h3>
          <form method="post" action="/auth/login">
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input name="email" type="text" id="emailInput" className="form-control gh-input" placeholder="valor" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input name="password" type="password" id="passwordInput" className="form-control gh-input" placeholder="Your password" required />
            </div>
            <button className="btn btn-primary w-100">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
}
