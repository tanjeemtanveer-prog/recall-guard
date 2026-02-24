import { useState } from "react"

export default function Auth({ onAuth }) {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function signup() {

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (data.token) {
      localStorage.setItem("token", data.token)
      onAuth()
    } else {
      alert("Signup failed")
    }
  }

  async function login() {

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    })

    const data = await res.json()

    if (data.token) {
      localStorage.setItem("token", data.token)
      onAuth()
    } else {
      alert("Login failed")
    }
  }

  return (
    <div style={{ padding: 50 }}>

      <h2>RecallGuard Login</h2>

      <input
        placeholder="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <br/><br/>

      <input
        type="password"
        placeholder="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <br/><br/>

      <button onClick={signup}>Signup</button>
      <button onClick={login}>Login</button>

    </div>
  )
}