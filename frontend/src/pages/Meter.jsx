import { useState, useEffect } from "react"
import { Icons } from "../components/Icons"

function Meter() {
  const [meterNumber, setMeterNumber] = useState("")
  const [consumerName, setConsumerName] = useState("")
  const [address, setAddress] = useState("")
  const [monthlyUsage, setMonthlyUsage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registeredSuccess, setRegisteredSuccess] = useState(false)
  const [existingMeters, setExistingMeters] = useState([])

  const storedUser = localStorage.getItem("smartbillUser")
  const user = storedUser ? JSON.parse(storedUser) : null

  const loadMeters = async () => {
    if (!user || !user.id) return
    try {
      const response = await fetch(`http://localhost:8080/api/meters/user/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setExistingMeters(data)
          if (data.length > 0 && !consumerName) {
            setConsumerName(user.fullName || data[0].consumerName || "")
          }
        }
      }
    } catch (err) {
      console.error("Error loading user meters:", err)
    }
  }

  useEffect(() => {
    loadMeters()
    if (user && user.fullName) {
      setConsumerName(user.fullName)
    }
  }, [user?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!user || !user.id) {
      alert("Please login to register a meter")
      setIsSubmitting(false)
      return
    }

    const meter = {
      meterNumber,
      consumerName,
      address,
      monthlyUsage: Number(monthlyUsage)
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/meters/${user.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(meter)
        }
      )

      if (response.ok) {
        setRegisteredSuccess(true)
        setMeterNumber("")
        setAddress("")
        setMonthlyUsage("")
        loadMeters()
        setTimeout(() => setRegisteredSuccess(false), 4000)
      } else {
        const err = await response.text()
        alert("Registration failed: " + err)
      }
    } catch (error) {
      alert("Backend connection failed")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeMeter = existingMeters.length > 0 ? existingMeters[0] : null

  return (
    <div className="dashboard animate-fade-in">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>Smart Electricity Meter</h1>
          <p>Register, pair, and calibrate your smart telemetry meter account.</p>
        </div>

        <div className="header-meta-badge">
          <Icons.Cpu size={15} />
          <span>Smart Meter Telemetry v2.4</span>
        </div>
      </div>

      <div className="meter-page-grid">
        {/* SOFTWARE SIMULATED LCD WIDGET */}
        <div className="card meter-info-card animate-fade-in-stagger-1">
          <div>
            <h2>
              <Icons.Gauge size={22} style={{ color: "#0284c7" }} />
              <span>Smart Meter Telemetry Display</span>
            </h2>

            <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>
              Digital meter profile linked with the SmartBill central grid engine for automated progressive billing.
            </p>

            {/* VISUAL LCD TELEMETRY WIDGET */}
            <div className="meter-preview-hardware">
              <div className="meter-lcd-display">
                <div className="meter-lcd-header">
                  <span>SMART-GRID TELEMETRY OS</span>
                  <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span className="status-dot-pulse" style={{ width: "6px", height: "6px" }}></span>
                    ONLINE
                  </span>
                </div>

                <div className="meter-lcd-units">
                  {monthlyUsage
                    ? Number(monthlyUsage).toLocaleString()
                    : activeMeter
                    ? Number(activeMeter.monthlyUsage).toLocaleString()
                    : "000.00"}
                  <span>kWh / Units</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "#64748b",
                    borderTop: "1px solid #1e293b",
                    paddingTop: "6px"
                  }}
                >
                  <span>ID: {meterNumber || (activeMeter ? activeMeter.meterNumber : "MTR-XXXX-XX")}</span>
                  <span>
                    {consumerName
                      ? consumerName.toUpperCase()
                      : activeMeter
                      ? activeMeter.consumerName.toUpperCase()
                      : (user ? user.fullName.toUpperCase() : "UNASSIGNED")}
                  </span>
                </div>
              </div>
            </div>

            {/* FEATURE TILES */}
            <div className="meter-features">
              <div className="meter-feature-row">
                <div className="feature-icon-badge">
                  <Icons.Bolt size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>Continuous Telemetry Tracking</strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Accurate tracking of active kilowatt-hour consumption</span>
                </div>
              </div>

              <div className="meter-feature-row">
                <div className="feature-icon-badge">
                  <Icons.Rupee size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>Automated Tiered Calculation</strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Calculates bill based on local slab tariff schedules</span>
                </div>
              </div>

              <div className="meter-feature-row">
                <div className="feature-icon-badge">
                  <Icons.History size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: "14px", color: "#0f172a" }}>Verifiable Reading Ledger</strong>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Verified history of power telemetry and billing events</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REGISTRATION FORM */}
        <div className="card animate-fade-in-stagger-2">
          <h2>
            <Icons.PlusCircle size={22} style={{ color: "#06b6d4" }} />
            <span>{existingMeters.length > 0 ? "Register Additional Meter" : "Register Smart Meter"}</span>
          </h2>

          <p className="form-description">
            Enter the meter identifier and consumer credentials to register the meter on your account.
          </p>

          <form onSubmit={handleSubmit}>
            <div>
              <label>Meter Serial Number</label>
              <input
                type="text"
                placeholder="Example: MTR-9042-X"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                required
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            <div>
              <label>Consumer Full Name</label>
              <input
                type="text"
                placeholder="Enter account holder name"
                value={consumerName}
                onChange={(e) => setConsumerName(e.target.value)}
                required
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            <div>
              <label>Grid Location / Installation Address</label>
              <input
                type="text"
                placeholder="Enter physical site address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            <div>
              <label>Estimated Baseline Monthly Usage (Units)</label>
              <input
                type="number"
                placeholder="Example: 150"
                value={monthlyUsage}
                onChange={(e) => setMonthlyUsage(e.target.value)}
                required
                min="0"
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ marginTop: "10px", width: "100%" }}
            >
              <Icons.ShieldCheck size={18} />
              <span>
                {isSubmitting ? "Provisioning on Grid..." : "Provision & Register Meter"}
              </span>
            </button>
          </form>

          {registeredSuccess && (
            <div className="reading-success" style={{ marginTop: "18px" }}>
              <Icons.CheckCircle size={20} style={{ color: "#16a34a" }} />
              <div>
                <strong>Smart Meter Provisioned</strong>
                <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
                  Meter credentials successfully linked to your SmartBill account.
                </p>
              </div>
            </div>
          )}

          {/* ACTIVE METERS LIST */}
          {existingMeters.length > 0 && (
            <div style={{ marginTop: "24px", borderTop: "1px solid #e2e8f0", paddingTop: "16px" }}>
              <h3 style={{ fontSize: "14px", color: "#475569", marginBottom: "10px" }}>Linked Meters ({existingMeters.length})</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {existingMeters.map((m) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "13px" }}>
                    <div>
                      <strong style={{ color: "#0f172a" }}>{m.meterNumber}</strong>
                      <span style={{ color: "#64748b", marginLeft: "8px" }}>{m.address}</span>
                    </div>
                    <span style={{ color: "#0284c7", fontWeight: 700 }}>{m.monthlyUsage} kWh Baseline</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Meter