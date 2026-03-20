import { useState, useEffect } from 'react'
import { supabase } from './utils/supabase'

export default function App() {
  const [todos, setTodos] = useState([{id: 1, name: 'Buy groceries'}, {id: 2, name: 'Buy a new phone'}, {id: 3, name: 'Buy a new car'}])

  useEffect(() => {
    async function getTodos() {
      const { data: todos } = await supabase.from('todos').select()

      if (todos) {
        setTodos(todos)
      }
    }

    getTodos()
  }, [])

  return (
    <ul>
      {console.log(todos)}
      {todos.map((todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  )
}