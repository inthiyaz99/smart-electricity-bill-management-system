import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

function Login() {
  const navigate = useNavigate()

  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const isEmail = loginId.includes("@")

    const user = {
      email: isEmail ? loginId : "",
      mobile: isEmail ? "" : loginId,
      password: password
    }

    try {
      const response = await fetch(
        "http://localhost:8080/api/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(user)
        }
      )

      const text = await response.text()

      let result

      try {
        result = JSON.parse(text)
      } catch {
        result = text
      }

      if (response.ok) {
        localStorage.setItem(
          "smartbillUser",
          JSON.stringify(result)
        )

        alert("Login successful!")

        navigate("/")
      } else {
        alert(result)
      }

    } catch (error) {
      console.error("Login error:", error)
      alert("Unable to connect to SmartBill server")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">

      <div className="auth-background">
        <div className="energy-orb orb-one"></div>
        <div className="energy-orb orb-two"></div>
        <div className="energy-orb orb-three"></div>
      </div>

      <div className="auth-card">

        <div className="auth-logo">
          <span>⚡</span>
        </div>

        <div className="auth-status">
          <span></span>
          SMART GRID ONLINE
        </div>

        <h1>Welcome Back</h1>

        <p className="auth-subtitle">
          Access your SmartBill electricity dashboard
        </p>

        <form onSubmit={handleSubmit}>

          <div className="auth-field">

            <label>Email or Mobile Number</label>

            <div className="auth-input">

              <span>◉</span>

              <input
                type="text"
                placeholder="Enter email or mobile"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
              />

            </div>

          </div>

          <div className="auth-field">

            <label>Password</label>

            <div className="auth-input">

              <span>⌁</span>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

            </div>

          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading
              ? "AUTHENTICATING..."
              : "LOGIN TO SMARTBILL"}

            <span>→</span>
          </button>

        </form>

        <div className="auth-divider">
          <span></span>
          SECURE ACCESS
          <span></span>
        </div>

        <p className="auth-footer">
          New to SmartBill?{" "}
          <Link to="/register">
            Create Account
          </Link>
        </p>

        <div className="auth-security">
          <span>🔒</span>
          Your account is protected by SmartBill security
        </div>

      </div>

    </div>
  )
}

export default Login