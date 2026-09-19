import { useEffect, useState } from "react"
import { Icons, useCountUp } from "../components/Icons"

function Bills() {
  const [bills, setBills] = useState([])
  const [latestBill, setLatestBill] = useState(null)
  const [meter, setMeter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState(null)

  const [simulatedUnits, setSimulatedUnits] = useState(150)

  // Get logged-in user
  const storedUser = localStorage.getItem("smartbillUser")
  const user = storedUser ? JSON.parse(storedUser) : null

  // Load user's meter and bills
  useEffect(() => {
    const loadBills = async () => {
      try {
        setLoading(true)
        setError("")

        let activeMeter = null
        if (user && user.id) {
          const meterResponse = await fetch(`http://localhost:8080/api/meters/user/${user.id}`)
          if (meterResponse.ok) {
            const meters = await meterResponse.json()
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

        if (!activeMeter) {
          setError("No active smart meter found for this account. Please register a meter first.")
          setLoading(false)
          return
        }

        // Get bills belonging to this meter
        const billResponse = await fetch(`http://localhost:8080/api/bills/meter/${activeMeter.id}`)
        if (billResponse.ok) {
          const billData = await billResponse.json()
          if (Array.isArray(billData)) {
            setBills(billData)
            if (billData.length > 0) {
              setLatestBill(billData[0])
            }
          }
        }
      } catch (err) {
        console.error("Bills loading error:", err)
        setError("Unable to connect to SmartBill billing service.")
      } finally {
        setLoading(false)
      }
    }

    loadBills()
  }, [user?.id])

  // Progressive slab calculation for simulator
  const calculateSimulatorBill = (units) => {
    const num = Math.max(0, Number(units) || 0)
    const firstSlab = Math.min(num, 50)
    const secondSlab = Math.min(Math.max(num - 50, 0), 50)
    const thirdSlab = Math.min(Math.max(num - 100, 0), 100)
    const fourthSlab = Math.min(Math.max(num - 200, 0), 100)
    const fifthSlab = Math.max(num - 300, 0)

    const energyCharge =
      (firstSlab * 1.95) +
      (secondSlab * 3.10) +
      (thirdSlab * 4.80) +
      (fourthSlab * 6.40) +
      (fifthSlab * 7.50)

    return energyCharge + 50.0 // Fixed charge ₹50
  }

  const simulatedCost = calculateSimulatorBill(simulatedUnits)

  const units = latestBill ? Number(latestBill.unitsConsumed) : 0
  const billAmount = latestBill ? Number(latestBill.totalAmount) : 0

  const firstSlab = Math.min(units, 50)
  const secondSlab = Math.min(Math.max(units - 50, 0), 50)
  const thirdSlab = Math.min(Math.max(units - 100, 0), 100)
  const fourthSlab = Math.min(Math.max(units - 200, 0), 100)
  const fifthSlab = Math.max(units - 300, 0)

  const firstAmount = firstSlab * 1.95
  const secondAmount = secondSlab * 3.10
  const thirdAmount = thirdSlab * 4.80
  const fourthAmount = fourthSlab * 6.40
  const fifthAmount = fifthSlab * 7.50

  const animatedBill = useCountUp(billAmount, 900, 2)
  const animatedUnits = useCountUp(units, 800, 0)

  return (
    <div className="dashboard animate-fade-in">
      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>Smart Electricity Billing & Tariff</h1>
          <p>Transparent multi-tier slab calculations and historical invoice records.</p>
        </div>

        <div className="header-meta-badge">
          <Icons.Receipt size={15} />
          <span>SmartBill Tariff Engine v2.4</span>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="card">
          <p>Loading billing telemetry...</p>
        </div>
      )}

      {/* ERROR / EMPTY METER */}
      {!loading && error && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Icons.Receipt size={26} />
            </div>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* METER INFORMATION */}
          {meter && (
            <div className="card animate-fade-in-stagger-1">
              <h2>
                <Icons.Gauge size={22} style={{ color: "#0284c7" }} />
                <span>Active Smart Meter</span>
              </h2>

              <div className="reading-details">
                <div className="reading-detail-item">
                  <span>Meter Serial</span>
                  <strong>{meter.meterNumber}</strong>
                </div>

                <div className="reading-detail-item">
                  <span>Consumer</span>
                  <strong>{meter.consumerName}</strong>
                </div>

                <div className="reading-detail-item">
                  <span>Grid Location</span>
                  <strong>{meter.address}</strong>
                </div>

                <div className="reading-detail-item">
                  <span>Baseline Quota</span>
                  <strong style={{ color: "#0284c7" }}>{meter.monthlyUsage} Units</strong>
                </div>
              </div>
            </div>
          )}

          {/* SUMMARY STAT CARDS */}
          <div className="cards">
            <div className="card summary-card animate-fade-in-stagger-1">
              <div className="summary-icon icon-cyan">
                <Icons.Rupee size={28} />
              </div>
              <div className="summary-content">
                <span>Latest Invoice</span>
                <p>₹{animatedBill}</p>
                <small>
                  <Icons.Sparkles size={13} style={{ color: "#06b6d4" }} />
                  Progressive slab computed
                </small>
              </div>
            </div>

            <div className="card summary-card animate-fade-in-stagger-2">
              <div className="summary-icon">
                <Icons.Bolt size={28} />
              </div>
              <div className="summary-content">
                <span>Units Consumed</span>
                <p>{animatedUnits} <span className="unit-label">kWh</span></p>
                <small>
                  <Icons.Activity size={13} style={{ color: "#0284c7" }} />
                  Latest interval record
                </small>
              </div>
            </div>

            <div className="card summary-card animate-fade-in-stagger-3">
              <div className="summary-icon icon-emerald">
                <Icons.Layers size={28} />
              </div>
              <div className="summary-content">
                <span>Tariff Schedule</span>
                <p style={{ fontSize: "24px" }}>Multi-Slab</p>
                <small>
                  <Icons.ShieldCheck size={13} style={{ color: "#10b981" }} />
                  Progressive tier structure
                </small>
              </div>
            </div>
          </div>

          {/* TARIFF BREAKDOWN */}
          {latestBill && (
            <div className="card bill-breakdown animate-fade-in-stagger-2">
              <h2>
                <Icons.Receipt size={22} style={{ color: "#0284c7" }} />
                <span>Active Progressive Tariff Breakdown</span>
              </h2>

              <p className="form-description">
                Tier-by-tier breakdown calculated for {units} consumed units.
              </p>

              <div className="slab-tiers-container">
                <div className="bill-row">
                  <div>
                    <strong>Tier 1: 0 – 50 Units</strong>
                    <span>Rate: ₹1.95 per unit • Applied: {firstSlab} Units</span>
                  </div>
                  <strong className="slab-price">₹{firstAmount.toFixed(2)}</strong>
                </div>

                <div className="bill-row">
                  <div>
                    <strong>Tier 2: 51 – 100 Units</strong>
                    <span>Rate: ₹3.10 per unit • Applied: {secondSlab} Units</span>
                  </div>
                  <strong className="slab-price">₹{secondAmount.toFixed(2)}</strong>
                </div>

                <div className="bill-row">
                  <div>
                    <strong>Tier 3: 101 – 200 Units</strong>
                    <span>Rate: ₹4.80 per unit • Applied: {thirdSlab} Units</span>
                  </div>
                  <strong className="slab-price">₹{thirdAmount.toFixed(2)}</strong>
                </div>

                <div className="bill-row">
                  <div>
                    <strong>Tier 4: 201 – 300 Units</strong>
                    <span>Rate: ₹6.40 per unit • Applied: {fourthSlab} Units</span>
                  </div>
                  <strong className="slab-price">₹{fourthAmount.toFixed(2)}</strong>
                </div>

                {fifthSlab > 0 && (
                  <div className="bill-row">
                    <div>
                      <strong>Tier 5: Above 300 Units</strong>
                      <span>Rate: ₹7.50 per unit • Applied: {fifthSlab} Units</span>
                    </div>
                    <strong className="slab-price">₹{fifthAmount.toFixed(2)}</strong>
                  </div>
                )}

                <div className="bill-row">
                  <div>
                    <strong>Fixed Monthly Grid Charge</strong>
                    <span>Standard monthly infrastructure service charge</span>
                  </div>
                  <strong className="slab-price">₹{Number(latestBill.fixedCharge || 50).toFixed(2)}</strong>
                </div>
              </div>

              <div className="bill-total">
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Icons.Sparkles size={22} style={{ color: "#0284c7" }} />
                  <span>Total Electricity Bill:</span>
                </div>
                <strong>₹{Number(latestBill.totalAmount).toFixed(2)}</strong>
              </div>
            </div>
          )}

          {/* WHAT-IF SIMULATOR */}
          <div className="card bill-simulator-card animate-fade-in-stagger-3">
            <h2>
              <Icons.Sliders size={22} style={{ color: "#06b6d4" }} />
              <span>Interactive Progressive Tariff Estimator</span>
            </h2>

            <p className="form-description">
              Adjust the slider to preview progressive tiered tariffs at hypothetical consumption levels.
            </p>

            <div className="simulator-controls">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#475569" }}>
                  Hypothetical Consumption:
                  <strong style={{ color: "#0284c7", fontSize: "18px", marginLeft: "6px" }}>
                    {simulatedUnits} Units
                  </strong>
                </span>

                <span style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>
                  Projected Bill:
                  <strong style={{ color: "#059669", fontSize: "20px", marginLeft: "6px" }}>
                    ₹{simulatedCost.toFixed(2)}
                  </strong>
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="600"
                step="5"
                value={simulatedUnits}
                onChange={(e) => setSimulatedUnits(Number(e.target.value))}
                className="range-slider"
                aria-label="Simulated Units"
              />

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#94a3b8" }}>
                <span>0 Units (₹50)</span>
                <span>100 Units (₹302.50)</span>
                <span>200 Units (₹782.50)</span>
                <span>600 Units (₹3,672.50)</span>
              </div>
            </div>
          </div>

          {/* BILL HISTORY */}
          <div className="card animate-fade-in-stagger-4">
            <h2>
              <Icons.History size={22} style={{ color: "#0284c7" }} />
              <span>Historical Billing Records</span>
            </h2>

            {bills.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Icons.Receipt size={26} />
                </div>
                <p>No historical bills recorded yet.</p>
              </div>
            ) : (
              <div className="bill-history">
                {bills.map((bill, index) => (
                  <div className="history-item" key={bill.id || index}>
                    <div>
                      <span>Billing Date</span>
                      <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icons.Calendar size={14} style={{ color: "#0284c7" }} />
                        {new Date(bill.billDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </strong>
                    </div>

                    <div>
                      <span>Power Consumed</span>
                      <div className="units-badge">
                        <Icons.Bolt size={13} />
                        <span>{bill.unitsConsumed} Units</span>
                      </div>
                    </div>

                    <div>
                      <span>Total Amount</span>
                      <strong className="history-amount">
                        ₹{Number(bill.totalAmount).toFixed(2)}
                      </strong>
                    </div>

                    <div>
                      <span>Status</span>
                      <span className="status-pill status-success" style={{ fontSize: "11px", padding: "4px 10px" }}>
                        Generated
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Bills