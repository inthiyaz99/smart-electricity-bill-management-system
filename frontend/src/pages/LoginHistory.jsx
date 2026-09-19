import { useEffect, useState } from "react"

function LoginHistory() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const user = JSON.parse(localStorage.getItem("smartbillUser"))

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    fetch(`http://localhost:8080/api/users/login-history/${user.id}`)
      .then((response) => response.json())
      .then((data) => {
        setHistory(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error(error)
        setLoading(false)
      })
  }, [user])

  return (
    <div className="login-history-page">
      <div className="page-header">
        <div>
          <span className="section-label">SECURITY CENTER</span>
          <h1>Login History</h1>
          <p>Monitor your recent SmartBill account activity.</p>
        </div>

        <div className="security-badge">
          🔐 Account Secure
        </div>
      </div>

      {loading ? (
        <div className="history-empty">
          Loading login activity...
        </div>
      ) : history.length === 0 ? (
        <div className="history-empty">
          No login activity found.
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div className="history-card" key={item.id}>
              <div className="history-icon">
                {item.loginMethod === "EMAIL" ? "✉" : "📱"}
              </div>

              <div className="history-info">
                <h3>
                  {item.loginMethod === "EMAIL"
                    ? "Email Login"
                    : "Mobile Login"}
                </h3>

                <p>
                  Login: {item.loginTime}
                </p>

                <p>
                  Logout:{" "}
                  {item.logoutTime
                    ? item.logoutTime
                    : "Currently Active"}
                </p>
              </div>

              <div
                className={
                  item.logoutTime
                    ? "history-status completed"
                    : "history-status active"
                }
              >
                {item.logoutTime ? "Completed" : "Active"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default LoginHistory