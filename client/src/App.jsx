import { useState } from "react"
import Auth from "./Auth"
import MainApp from "./MainApp"

export default function App() {

  const [authed, setAuthed] = useState(
    !!localStorage.getItem("token")
  )

  if (!authed)
    return <Auth onAuth={() => setAuthed(true)} />

  return <MainApp />
}