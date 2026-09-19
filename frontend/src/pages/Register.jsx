import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"

function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    setLoading(true)

    const user = {
      fullName: name,
      email,
      mobile,
      password
    }

    try {
      const response = await fetch(
        "http://localhost:8080/api/users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(user)
        }
      )

      const result = await response.text()

      if (response.ok) {
        alert("Account created successfully!")
        navigate("/login")
      } else {
        alert(result)
      }
    } catch (error) {
      alert("Backend connection failed")
      console.error(error)
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

      <div className="auth-card register-card">
        <div className="auth-logo">
          <span>⚡</span>
        </div>

        <div className="auth-status">
          <span></span>
          SMART GRID ONLINE
        </div>

        <h1>Create Account</h1>

        <p className="auth-subtitle">
          Join SmartBill and manage your electricity smarter
        </p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Full Name</label>

            <div className="auth-input">
              <span>◉</span>

              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Email</label>

            <div className="auth-input">
              <span>✉</span>

              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Mobile Number</label>

            <div className="auth-input">
              <span>◉</span>

              <input
                type="tel"
                placeholder="Enter your mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
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
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label>Confirm Password</label>

            <div className="auth-input">
              <span>⌁</span>

              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "CREATING ACCOUNT..." : "CREATE SMARTBILL ACCOUNT"}
            <span>→</span>
          </button>
        </form>

        <div className="auth-divider">
          <span></span>
          SECURE REGISTRATION
          <span></span>
        </div>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>

        <div className="auth-security">
          <span>🔒</span>
          Your information is securely stored
        </div>
      </div>
    </div>
  )
}

export default Register