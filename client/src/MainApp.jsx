import { useEffect, useState } from "react"
import { apiFetch } from "./apiFetch"

export default function MainApp() {

  const [notes, setNotes] = useState([])
  const [content, setContent] = useState("")

  async function loadNotes() {
    const res = await apiFetch("/api/notes")
    const data = await res.json()
    setNotes(data)
  }

  async function addNote() {

    if (!content.trim()) return

    await apiFetch("/api/notes", {
      method: "POST",
      body: JSON.stringify({ content })
    })

    setContent("")
    loadNotes()
  }

  useEffect(() => {
    loadNotes()
  }, [])

  return (
    <div style={{ padding: 40 }}>

      <h2>Your Notes</h2>

      <input
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Write note"
      />

      <button onClick={addNote}>
        Add
      </button>

      <ul>
        {notes.map(n => (
          <li key={n.id}>
            {n.content}
          </li>
        ))}
      </ul>

    </div>
  )
}