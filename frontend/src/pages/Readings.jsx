import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Icons, useCountUp } from "../components/Icons"

function Readings() {
  const [previousReading, setPreviousReading] = useState("")
  const [currentReading, setCurrentReading] = useState("")
  const [readingDate, setReadingDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [usage, setUsage] = useState(null)
  const [readings, setReadings] = useState([])
  const [meter, setMeter] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const storedUser = localStorage.getItem("smartbillUser")
  const user = storedUser ? JSON.parse(storedUser) : null

  const loadData = async () => {
    try {
      let activeMeter = null
      if (user && user.id) {
        const meterRes = await fetch(`http://localhost:8080/api/meters/user/${user.id}`)
        if (meterRes.ok) {
          const meters = await meterRes.json()
          if (Array.isArray(meters) && meters.length > 0) {
            activeMeter = meters[0]
            setMeter(activeMeter)
          }
        }
      }

      if (!activeMeter) {
        const allMetersRes = await fetch("http://localhost:8080/api/meters")
        if (allMetersRes.ok) {
          const allMeters = await allMetersRes.json()
          if (Array.isArray(allMeters) && allMeters.length > 0) {
            activeMeter = allMeters[allMeters.length - 1]
            setMeter(activeMeter)
          }
        }
      }

      let readingsUrl = "http://localhost:8080/api/readings"
      if (activeMeter && activeMeter.id) {
        readingsUrl = `http://localhost:8080/api/readings/meter/${activeMeter.id}`
      }

      const response = await fetch(readingsUrl)
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setReadings(data)
          // Prepopulate previousReading from the latest reading if empty
          if (data.length > 0 && !previousReading) {
            const latest = data[0]
            if (latest && latest.currentReading !== undefined) {
              setPreviousReading(latest.currentReading.toString())
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to load readings:", error)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  // Calculate live delta as user types
  const prevNum = parseFloat(previousReading) || 0
  const currNum = parseFloat(currentReading) || 0
  const liveDelta = previousReading !== "" && currentReading !== "" ? currNum - prevNum : null
  const isValidDelta = liveDelta !== null && liveDelta >= 0

  const handleSubmit = async (e) => {
    e.preventDefault()

    const previous = Number(previousReading)
    const current = Number(currentReading)

    if (current < previous) {
      alert("Current reading cannot be less than previous reading")
      return
    }

    const calculatedUsage = current - previous
    setIsSubmitting(true)

    const readingPayload = {
      previousReading: previous,
      currentReading: current,
      unitsUsed: calculatedUsage,
      readingDate
    }

    try {
      const url = meter && meter.id
        ? `http://localhost:8080/api/readings/meter/${meter.id}`
        : "http://localhost:8080/api/readings"

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(readingPayload)
      })

      if (response.ok) {
        setUsage(calculatedUsage)
        setPreviousReading(current.toString())
        setCurrentReading("")
        setReadingDate(new Date().toISOString().split("T")[0])

        loadData()
      } else {
        const errText = await response.text()
        alert("Failed to save reading: " + errText)
      }
    } catch (error) {
      alert("Backend connection failed")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalUnits = readings.reduce(
    (total, item) => total + (Number(item.unitsUsed) || 0),
    0
  )

  const latestUsage =
    readings.length > 0
      ? readings[0].unitsUsed || 0
      : 0

  const animatedTotalReadings = useCountUp(readings.length, 800, 0)
  const animatedTotalUnits = useCountUp(totalUnits, 900, 0)
  const animatedLatestUsage = useCountUp(latestUsage, 800, 0)

  return (
    <div className="dashboard animate-fade-in">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>Electricity Meter Readings</h1>
          <p>Record interval telemetry and maintain verifiable power consumption records.</p>
        </div>
        <div className="header-meta-badge">
          <Icons.Activity size={15} />
          <span>{meter ? `Meter: ${meter.meterNumber}` : "Telemetry Ledger"}</span>
        </div>
      </div>

      {/* SUMMARY METRIC CARDS */}
      <div className="cards">
        <div className="card summary-card animate-fade-in-stagger-1">
          <div className="summary-icon icon-cyan">
            <Icons.Receipt size={28} />
          </div>
          <div className="summary-content">
            <span>Total Readings</span>
            <p>{animatedTotalReadings}</p>
            <small>
              <Icons.ShieldCheck size={13} style={{ color: "#06b6d4" }} />
              Verified ledger records
            </small>
          </div>
        </div>

        <div className="card summary-card animate-fade-in-stagger-2">
          <div className="summary-icon">
            <Icons.Bolt size={28} />
          </div>
          <div className="summary-content">
            <span>Cumulative Energy</span>
            <p>{animatedTotalUnits} <span className="unit-label">kWh</span></p>
            <small>
              <Icons.TrendingUp size={13} style={{ color: "#0284c7" }} />
              Total power logged
            </small>
          </div>
        </div>

        <div className="card summary-card animate-fade-in-stagger-3">
          <div className="summary-icon icon-emerald">
            <Icons.Gauge size={28} />
          </div>
          <div className="summary-content">
            <span>Latest Interval</span>
            <p>{animatedLatestUsage} <span className="unit-label">kWh</span></p>
            <small>
              <Icons.Activity size={13} style={{ color: "#10b981" }} />
              Most recent consumption
            </small>
          </div>
        </div>
      </div>

      {/* LOG READING FORM */}
      <div className="card animate-fade-in-stagger-2" style={{ marginBottom: "24px" }}>
        <h2>
          <Icons.PlusCircle size={22} style={{ color: "#0284c7" }} />
          <span>Log New Meter Reading</span>
        </h2>

        {!meter && (
          <div className="status-pill status-warning" style={{ marginBottom: "16px", display: "inline-flex" }}>
            <Icons.AlertTriangle size={15} />
            <span>No active smart meter linked. Readings will be saved globally until a meter is registered.</span>
          </div>
        )}

        <p className="form-description">
          Enter previous and current optical or digital meter indices. Net units are dynamically computed.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <div>
              <label>Previous Reading Index</label>
              <input
                type="number"
                placeholder="e.g. 1200"
                value={previousReading}
                onChange={(e) => setPreviousReading(e.target.value)}
                required
                min="0"
                step="any"
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            <div>
              <label>Current Reading Index</label>
              <input
                type="number"
                placeholder="e.g. 1350"
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                required
                min="0"
                step="any"
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>

            <div>
              <label>Reading Date</label>
              <input
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                required
                style={{ width: "100%", marginTop: "6px" }}
              />
            </div>
          </div>

          {/* LIVE COMPUTED DELTA PREVIEW */}
          {liveDelta !== null && (
            <div
              className="live-delta-preview"
              style={{
                background: isValidDelta ? "linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)" : "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
                borderColor: isValidDelta ? "#93c5fd" : "#fca5a5"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {isValidDelta ? (
                  <Icons.Bolt size={20} style={{ color: "#0284c7" }} />
                ) : (
                  <Icons.AlertTriangle size={20} style={{ color: "#dc2626" }} />
                )}
                <div>
                  <strong style={{ color: isValidDelta ? "#0369a1" : "#b91c1c", fontSize: "14px" }}>
                    {isValidDelta
                      ? `Computed Consumption: ${liveDelta.toFixed(2)} Units`
                      : "Invalid Input: Current index cannot be lower than previous index"}
                  </strong>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                    {isValidDelta
                      ? `Formula: ${currNum} (Current) - ${prevNum} (Previous)`
                      : "Please correct the meter reading indices"}
                  </p>
                </div>
              </div>
              {isValidDelta && (
                <div className="units-badge" style={{ background: "#0284c7", color: "#ffffff" }}>
                  +{liveDelta.toFixed(1)} kWh
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || (liveDelta !== null && !isValidDelta)}
            style={{ alignSelf: "flex-start", marginTop: "10px" }}
          >
            <Icons.PlusCircle size={17} />
            <span>{isSubmitting ? "Committing Reading..." : "Commit Reading to Grid"}</span>
          </button>
        </form>

        {usage !== null && (
          <div className="reading-success">
            <Icons.CheckCircle size={22} style={{ color: "#16a34a" }} />
            <div>
              <strong>Reading Committed Successfully: {usage} Units Used</strong>
              <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
                Consumption ledger updated and progressive invoice generated in billing records.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* READING HISTORY */}
      <div className="card animate-fade-in-stagger-3">
        <h2>
          <Icons.History size={22} style={{ color: "#0284c7" }} />
          <span>Telemetry Reading History</span>
        </h2>

        {readings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icons.History size={26} />
            </div>
            <p>No telemetry readings recorded yet.</p>
          </div>
        ) : (
          <div className="reading-history">
            {readings.map((item, idx) => (
              <div className="reading-history-item" key={item.id || idx}>
                <div>
                  <span>Date Logged</span>
                  <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Icons.Calendar size={14} style={{ color: "#0284c7" }} />
                    {item.readingDate}
                  </strong>
                </div>

                <div>
                  <span>Previous Index</span>
                  <strong>{item.previousReading}</strong>
                </div>

                <div>
                  <span>Current Index</span>
                  <strong>{item.currentReading}</strong>
                </div>

                <div>
                  <span>Net Consumption</span>
                  <div className="units-badge">
                    <Icons.Bolt size={13} />
                    <span>{item.unitsUsed} Units</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Readings