import "./App.css"

import Profile from "./pages/Profile"
import Bills from "./pages/Bills"
import Readings from "./pages/Readings"
import Meter from "./pages/Meter"
import Dashboard from "./pages/Dashboard"
import Register from "./pages/Register"
import Login from "./pages/Login"
import LoginHistory from "./pages/LoginHistory"

import { BrowserRouter, Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<Dashboard />} />
        <Route path="/meter" element={<Meter />} />
        <Route path="/readings" element={<Readings />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login-history" element={<LoginHistory />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App