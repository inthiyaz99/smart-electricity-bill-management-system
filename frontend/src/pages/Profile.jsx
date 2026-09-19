import { useEffect, useState } from "react"
import { Icons } from "../components/Icons"

function Profile() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [mobile, setMobile] = useState("")
  const [meter, setMeter] = useState(null)
  const [saved, setSaved] = useState(false)

  const storedUser = localStorage.getItem("smartbillUser")
  const user = storedUser ? JSON.parse(storedUser) : null

  useEffect(() => {
    if (user) {
      if (user.fullName) setName(user.fullName)
      if (user.email) setEmail(user.email)
      if (user.mobile) setMobile(user.mobile)

      // Fetch linked meter info
      if (user.id) {
        fetch(`http://localhost:8080/api/meters/user/${user.id}`)
          .then((res) => res.json())
          .then((meters) => {
            if (Array.isArray(meters) && meters.length > 0) {
              setMeter(meters[0])
            }
          })
          .catch((err) => console.error("Error loading meter info:", err))
      }
    }
  }, [user?.id])

  const handleSubmit = (e) => {
    e.preventDefault()

    if (user) {
      const updated = {
        ...user,
        fullName: name,
        email,
        mobile
      }
      localStorage.setItem("smartbillUser", JSON.stringify(updated))
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 3500)
  }

  return (
    <div className="dashboard animate-fade-in">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>Consumer Account & Profile</h1>
          <p>Manage your smart energy consumer identity and linked meter credentials.</p>
        </div>
        <div className="header-meta-badge">
          <Icons.ShieldCheck size={15} />
          <span>Consumer Identity Vault</span>
        </div>
      </div>

      <div className="profile-page-grid">
        {/* CONSUMER ID PASS CARD */}
        <div className="card profile-info-card animate-fade-in-stagger-1">
          <div>
            <h2>
              <Icons.User size={22} style={{ color: "#0284c7" }} />
              <span>Digital Consumer ID</span>
            </h2>

            <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>
              Verified consumer profile associated with SmartBill grid telemetry.
            </p>

            {/* HOLOGRAPHIC STYLE PASS */}
            <div className="holographic-id-card">
              <div className="id-card-header">
                <div className="id-chip-icon"></div>
                <span style={{ fontSize: "11px", letterSpacing: "1.5px", fontWeight: 700, color: "#38bdf8" }}>
                  SMARTBILL PASS
                </span>
              </div>

              <div className="id-card-user">
                <div className="id-avatar">
                  {name ? name.charAt(0).toUpperCase() : <Icons.User size={24} />}
                </div>
                <div className="id-user-info">
                  <h3>{name || "Authorized Consumer"}</h3>
                  <p>{email || "consumer@smartbill.grid"}</p>
                </div>
              </div>

              <div className="id-card-footer">
                <span>TEL: {mobile || "+91 ••••• •••••"}</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>ACTIVE • VERIFIED</span>
              </div>
            </div>

            {/* LINKED METER BADGE */}
            {meter && (
              <div style={{ marginTop: "20px", padding: "14px 16px", background: "rgba(240, 249, 255, 0.8)", border: "1px solid #bae6fd", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Icons.Gauge size={16} style={{ color: "#0284c7" }} />
                  <strong style={{ fontSize: "13px", color: "#0369a1" }}>Linked Smart Meter</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#334155" }}>
                  <span>Serial: <strong>{meter.meterNumber}</strong></span>
                  <span>Grid: <strong>{meter.address}</strong></span>
                </div>
              </div>
            )}

            <div className="profile-features">
              <div className="profile-feature-row">
                <div className="feature-icon-badge">
                  <Icons.ShieldCheck size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>Account Privacy</strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Authentication secured via BCrypt encrypted credential protocols</span>
                </div>
              </div>

              <div className="profile-feature-row">
                <div className="feature-icon-badge">
                  <Icons.ZapFast size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>Real-time Grid Association</strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Binds telemetry intervals and invoices directly to your consumer account</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PROFILE FORM */}
        <div className="card animate-fade-in-stagger-2">
          <h2>
            <Icons.Sliders size={22} style={{ color: "#06b6d4" }} />
            <span>Update Consumer Details</span>
          </h2>

          <p className="form-description">
            Update your contact preferences for notifications and tariff alerts.
          </p>

          <form onSubmit={handleSubmit}>
            <div>
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            <div>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            <div>
              <label>Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter mobile contact number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            <button type="submit" style={{ marginTop: "10px", width: "100%" }}>
              <Icons.ShieldCheck size={18} />
              <span>Save & Update Profile</span>
            </button>
          </form>

          {saved && (
            <div className="reading-success" style={{ marginTop: "18px" }}>
              <Icons.CheckCircle size={20} style={{ color: "#16a34a" }} />
              <div>
                <strong>Consumer Profile Saved</strong>
                <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
                  Your profile details have been saved successfully.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile