import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Icons, useCountUp } from "../components/Icons"

function Dashboard() {
  const [meter, setMeter] = useState(null)
  const [reading, setReading] = useState(null)
  const [allReadings, setAllReadings] = useState([])
  const [limit, setLimit] = useState(
    localStorage.getItem("usageLimit") || "200"
  )
  const [bill, setBill] = useState(0)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const storedUser = localStorage.getItem("smartbillUser")
  const user = storedUser ? JSON.parse(storedUser) : null

  // Progressive slab calculator helper
  const calculateSlabBill = (units) => {
    const num = Math.max(0, Number(units) || 0)
    const firstSlab = Math.min(num, 50)
    const secondSlab = Math.min(Math.max(num - 50, 0), 50)
    const thirdSlab = Math.min(Math.max(num - 100, 0), 100)
    const fourthSlab = Math.min(Math.max(num - 200, 0), 100)
    const fifthSlab = Math.max(num - 300, 0)

    const energyCharge = (firstSlab * 1.95) +
                         (secondSlab * 3.10) +
                         (thirdSlab * 4.80) +
                         (fourthSlab * 6.40) +
                         (fifthSlab * 7.50)
    return energyCharge + 50.0 // Fixed charge ₹50
  }

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true)
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
            const meters = await allMetersRes.json()
            if (Array.isArray(meters) && meters.length > 0) {
              activeMeter = meters[meters.length - 1]
              setMeter(activeMeter)
            }
          }
        }

        let readingsUrl = "http://localhost:8080/api/readings"
        if (activeMeter && activeMeter.id) {
          readingsUrl = `http://localhost:8080/api/readings/meter/${activeMeter.id}`
        }

        const readingRes = await fetch(readingsUrl)
        if (readingRes.ok) {
          const readingsData = await readingRes.json()
          if (Array.isArray(readingsData) && readingsData.length > 0) {
            // Sort chronologically ascending for trend calculations
            const sortedAsc = [...readingsData].sort((a, b) => {
              const dateA = new Date(a.readingDate || 0)
              const dateB = new Date(b.readingDate || 0)
              return dateA - dateB || a.id - b.id
            })

            setAllReadings(sortedAsc)
            const latest = sortedAsc[sortedAsc.length - 1]
            setReading(latest)

            // Calculate bill via progressive endpoint or local fallback
            try {
              const billRes = await fetch(`http://localhost:8080/api/bills/calculate?units=${latest.unitsUsed}`)
              if (billRes.ok) {
                const amount = await billRes.json()
                setBill(amount)
              } else {
                setBill(calculateSlabBill(latest.unitsUsed))
              }
            } catch {
              setBill(calculateSlabBill(latest.unitsUsed))
            }
          }
        }
      } catch (err) {
        console.error("Dashboard telemetry sync error:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [user?.id])

  const units = reading ? Number(reading.unitsUsed) : 0
  const limitNumber = Number(limit) > 0 ? Number(limit) : 200
  const usagePercentage = Math.min((units / limitNumber) * 100, 100)
  const isOverLimit = units > limitNumber

  // Trend vs Previous Reading
  let trendPercentage = null
  let isTrendUp = false
  if (allReadings.length >= 2) {
    const prevReading = allReadings[allReadings.length - 2]
    const prevUnits = Number(prevReading.unitsUsed) || 0
    if (prevUnits > 0) {
      const diff = units - prevUnits
      trendPercentage = Math.abs((diff / prevUnits) * 100).toFixed(1)
      isTrendUp = diff > 0
    }
  }

  // High Usage Anomaly Detection (if current units > 125% of past average)
  let isHighUsageAnomaly = false
  let historicalAverage = 0
  if (allReadings.length >= 3) {
    const priorReadings = allReadings.slice(0, allReadings.length - 1)
    const sum = priorReadings.reduce((acc, r) => acc + (Number(r.unitsUsed) || 0), 0)
    historicalAverage = sum / priorReadings.length
    if (historicalAverage > 0 && units > historicalAverage * 1.25) {
      isHighUsageAnomaly = true
    }
  }

  // Smart Prediction (Estimated Month-End Consumption based on active data)
  let estimatedMonthUnits = null
  let estimatedMonthBill = null
  if (reading && units > 0) {
    // Project based on day of month or reading index
    const now = new Date()
    const currentDay = Math.max(now.getDate(), 1)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const dailyAvg = units / (currentDay > 15 ? currentDay : 15)
    estimatedMonthUnits = Math.round(dailyAvg * daysInMonth)
    estimatedMonthBill = calculateSlabBill(estimatedMonthUnits)
  }

  // Dynamic Contextual Insights
  const dynamicInsights = []
  if (trendPercentage !== null) {
    dynamicInsights.push(
      isTrendUp
        ? `Usage is up ${trendPercentage}% compared to previous reading (${units} vs ${allReadings[allReadings.length - 2].unitsUsed} kWh).`
        : `Usage decreased by ${trendPercentage}% compared to previous cycle.`
    )
  }
  if (usagePercentage >= 85 && !isOverLimit) {
    dynamicInsights.push(`Approaching monthly target: ${usagePercentage.toFixed(0)}% of limit utilized.`)
  } else if (!isOverLimit && units > 0) {
    dynamicInsights.push(`Operating within target quota (${(limitNumber - units).toFixed(0)} units remaining).`)
  }
  if (isOverLimit) {
    dynamicInsights.push(`Exceeded monthly target by ${(units - limitNumber).toFixed(0)} units. Consider energy conservation.`)
  }

  // Animated Numbers
  const animatedUnits = useCountUp(units, 900, 0)
  const animatedBill = useCountUp(bill, 900, 2)
  const animatedLimit = useCountUp(limitNumber, 800, 0)

  // Circular Gauge Calculations
  const radius = 68
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (usagePercentage / 100) * circumference

  const saveLimit = () => {
    localStorage.setItem("usageLimit", limit)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  })

  return (
    <div className="dashboard animate-fade-in">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>Smart Electricity Dashboard</h1>
          <p>Real-time consumption telemetry and predictive billing intelligence.</p>
        </div>
        <div className="header-meta-badge">
          <Icons.Calendar size={15} />
          <span>{currentDateFormatted}</span>
          <span style={{ color: "#cbd5e1" }}>•</span>
          <span style={{ color: "#0284c7", fontWeight: 700 }}>Telemetry Live</span>
        </div>
      </div>

      {/* HIGH USAGE ANOMALY ALERT */}
      {isHighUsageAnomaly && (
        <div className="anomaly-alert-banner animate-fade-in">
          <div className="alert-icon-wrap">
            <Icons.AlertTriangle size={22} />
          </div>
          <div className="alert-text-wrap">
            <strong>High Usage Warning</strong>
            <p>
              Current consumption ({units} Units) is unusually higher than your recent average ({historicalAverage.toFixed(1)} Units).
            </p>
          </div>
          <div className="alert-badge">
            Spike Detected
          </div>
        </div>
      )}

      {/* TOP SUMMARY STAT CARDS (VISUAL HIERARCHY) */}
      <div className="cards">
        {/* CARD 1: CURRENT USAGE */}
        <div className="card summary-card animate-fade-in-stagger-1">
          <div className="summary-icon icon-cyan">
            <Icons.Bolt size={28} />
          </div>
          <div className="summary-content">
            <span>Current Usage</span>
            <p>{animatedUnits} <span className="unit-label">kWh</span></p>
            <small>
              <Icons.Activity size={13} style={{ color: "#0284c7" }} />
              {reading ? `Recorded ${reading.readingDate}` : "Latest recorded reading"}
            </small>
          </div>
        </div>

        {/* CARD 2: ESTIMATED BILL */}
        <div className="card summary-card animate-fade-in-stagger-2">
          <div className="summary-icon">
            <Icons.Rupee size={28} />
          </div>
          <div className="summary-content">
            <span>Estimated Bill</span>
            <p>₹{animatedBill}</p>
            <small>
              <Icons.Sparkles size={13} style={{ color: "#06b6d4" }} />
              Progressive slab tariff applied
            </small>
          </div>
        </div>

        {/* CARD 3: USAGE TREND / MONTHLY TARGET */}
        <div className="card summary-card animate-fade-in-stagger-3">
          <div className="summary-icon icon-emerald">
            {trendPercentage !== null ? <Icons.TrendingUp size={28} /> : <Icons.Target size={28} />}
          </div>
          <div className="summary-content">
            <span>{trendPercentage !== null ? "Usage Trend" : "Monthly Target"}</span>
            {trendPercentage !== null ? (
              <p style={{ color: isTrendUp ? "#dc2626" : "#059669", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{isTrendUp ? "↑" : "↓"} {trendPercentage}%</span>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>vs prev</span>
              </p>
            ) : (
              <p>{animatedLimit} <span className="unit-label">Units</span></p>
            )}
            <small>
              <Icons.ShieldCheck size={13} style={{ color: "#10b981" }} />
              {isOverLimit ? "Quota exceeded" : "Operating within quota"}
            </small>
          </div>
        </div>
      </div>

      {/* MAIN DASHBOARD GRID */}
      <div className="dashboard-grid">
        {/* LEFT: SMART METER & SMART INSIGHTS */}
        <div className="dashboard-column-left">
          {/* MY SMART METER CARD */}
          <div className="card animate-fade-in-stagger-2" style={{ marginBottom: "24px" }}>
            <h2>
              <Icons.Gauge size={22} style={{ color: "#0284c7" }} />
              <span>Active Smart Meter</span>
            </h2>

            {meter ? (
              <div className="meter-details">
                <div className="meter-detail-item">
                  <span>Meter Serial</span>
                  <strong>{meter.meterNumber}</strong>
                </div>

                <div className="meter-detail-item">
                  <span>Consumer Name</span>
                  <strong>{meter.consumerName}</strong>
                </div>

                <div className="meter-detail-item">
                  <span>Grid Location</span>
                  <strong>{meter.address}</strong>
                </div>

                <div className="meter-detail-item">
                  <span>Baseline Quota</span>
                  <strong style={{ color: "#0284c7" }}>{meter.monthlyUsage} Units</strong>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Icons.Gauge size={26} />
                </div>
                <p>No smart meter registered yet.</p>
                <Link to="/meter" style={{ marginTop: "14px" }}>
                  <button type="button">
                    <Icons.PlusCircle size={16} />
                    <span>Register Meter</span>
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* SMART PREDICTION & DATA INSIGHTS */}
          <div className="card animate-fade-in-stagger-3">
            <h2>
              <Icons.Sparkles size={22} style={{ color: "#06b6d4" }} />
              <span>Smart Prediction & Insights</span>
            </h2>

            {estimatedMonthUnits !== null ? (
              <div className="prediction-insights-wrapper">
                {/* PREDICTION BADGE */}
                <div className="prediction-box">
                  <div className="prediction-stat">
                    <span>Estimated Month-End</span>
                    <strong>~{estimatedMonthUnits} kWh</strong>
                    <small>Forecasted usage</small>
                  </div>
                  <div className="prediction-divider"></div>
                  <div className="prediction-stat">
                    <span>Projected Bill</span>
                    <strong style={{ color: "#0284c7" }}>~₹{estimatedMonthBill.toFixed(2)}</strong>
                    <small>Based on current pace</small>
                  </div>
                </div>

                {/* DYNAMIC INSIGHT BULLETS */}
                <div className="insights-list">
                  {dynamicInsights.map((insight, idx) => (
                    <div className="insight-bullet" key={idx}>
                      <span className="insight-dot"></span>
                      <p>{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "20px 10px" }}>
                <p>Log interval readings to unlock predictive forecasting and intelligence.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: USAGE TELEMETRY & PROGRESS GAUGE */}
        <div className="card animate-fade-in-stagger-3">
          <h2>
            <Icons.Activity size={22} style={{ color: "#06b6d4" }} />
            <span>Telemetry & Quota Progress</span>
          </h2>

          <div className="usage-viz-container">
            <div className="gauge-display-wrapper">
              {/* CIRCULAR GAUGE */}
              <div className="circular-gauge-wrapper">
                <svg className="circular-gauge-svg" viewBox="0 0 160 160">
                  <circle
                    className="gauge-bg-circle"
                    cx="80"
                    cy="80"
                    r={radius}
                  />
                  <circle
                    className="gauge-progress-circle"
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={isOverLimit ? "#ef4444" : usagePercentage > 80 ? "#f59e0b" : "#0284c7"}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="gauge-center-content">
                  <span className="gauge-percentage-text">
                    {usagePercentage.toFixed(0)}%
                  </span>
                  <span className="gauge-sub-text">Quota Used</span>
                </div>
              </div>

              {/* GAUGE STATS COLUMN */}
              <div className="gauge-stats-column">
                <div className="gauge-stat-item">
                  <span>Consumed:</span>
                  <strong>{units} Units</strong>
                </div>
                <div className="gauge-stat-item">
                  <span>Monthly Limit:</span>
                  <strong>{limitNumber} Units</strong>
                </div>
                <div className="gauge-stat-item">
                  <span>Remaining:</span>
                  <strong style={{ color: isOverLimit ? "#dc2626" : "#059669" }}>
                    {isOverLimit ? `+${units - limitNumber} Over` : `${limitNumber - units} Units`}
                  </strong>
                </div>
              </div>
            </div>

            {/* ENERGY FLOW STREAM BAR */}
            <div className="energy-flow-bar">
              <div
                className={`energy-flow-fill ${isOverLimit ? "fill-warning" : ""}`}
                style={{ width: `${usagePercentage}%` }}
              ></div>
            </div>

            {/* STATUS ALERT PILL */}
            <div>
              {isOverLimit ? (
                <div className="status-pill status-warning">
                  <Icons.AlertTriangle size={16} />
                  <span>Threshold Exceeded: Exceeds monthly target by {units - limitNumber} Units</span>
                </div>
              ) : (
                <div className="status-pill status-success">
                  <Icons.CheckCircle size={16} />
                  <span>Energy Status Optimal: Consumed {units} of {limitNumber} allocated units</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONSUMPTION TREND VISUALIZATION */}
      {allReadings.length > 1 && (
        <div className="card trend-chart-card animate-fade-in-stagger-3" style={{ marginBottom: "24px" }}>
          <div className="card-header-flex">
            <h2>
              <Icons.TrendingUp size={22} style={{ color: "#0284c7" }} />
              <span>Consumption Trend History</span>
            </h2>
            <span className="chart-subtitle">Telemetry interval comparison</span>
          </div>

          <div className="trend-bar-chart">
            {allReadings.map((r, i) => {
              const u = Number(r.unitsUsed) || 0
              const maxUnits = Math.max(...allReadings.map(item => Number(item.unitsUsed) || 1), limitNumber)
              const heightPercent = Math.min(Math.max((u / maxUnits) * 100, 12), 100)
              const isCurrent = i === allReadings.length - 1

              return (
                <div className="trend-bar-item" key={r.id || i}>
                  <div className="trend-bar-track">
                    <div
                      className={`trend-bar-fill ${isCurrent ? "current-bar" : ""}`}
                      style={{ height: `${heightPercent}%` }}
                    >
                      <span className="trend-bar-tooltip">{u} kWh</span>
                    </div>
                  </div>
                  <span className="trend-bar-label">{r.readingDate ? r.readingDate.slice(5) : `R${i + 1}`}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* MONTHLY USAGE LIMIT TARGET ADJUSTER */}
      <div className="card limit-card animate-fade-in-stagger-3">
        <div>
          <h2>
            <Icons.Sliders size={20} style={{ color: "#0284c7" }} />
            <span>Monthly Usage Limit Target</span>
          </h2>
          <p>Configure your smart threshold alerts to prevent unexpected high tariff escalations.</p>
        </div>

        <div className="limit-controls">
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            placeholder="Enter limit"
            min="1"
            aria-label="Monthly usage limit in units"
          />

          <button onClick={saveLimit} type="button">
            <Icons.Target size={16} />
            <span>{saveSuccess ? "Saved!" : "Save Target"}</span>
          </button>
        </div>
      </div>

      {/* LATEST READING TELEMETRY */}
      {reading && (
        <div className="card latest-reading animate-fade-in-stagger-4">
          <h2>
            <Icons.Receipt size={22} style={{ color: "#0284c7" }} />
            <span>Latest Reading Telemetry</span>
          </h2>

          <div className="reading-details">
            <div className="reading-detail-item">
              <span>Previous Reading</span>
              <strong>{reading.previousReading}</strong>
            </div>

            <div className="reading-detail-item">
              <span>Current Reading</span>
              <strong>{reading.currentReading}</strong>
            </div>

            <div className="reading-detail-item">
              <span>Units Consumed</span>
              <strong style={{ color: "#0284c7" }}>{reading.unitsUsed} Units</strong>
            </div>

            <div className="reading-detail-item">
              <span>Logged Date</span>
              <strong>{reading.readingDate}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard