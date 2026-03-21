import { useState, useEffect } from 'react'
import { supabase } from './utils/supabase'
import styles from './App.module.css'

import Face from './components/Face'

export default function App() {
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    async function getPhotos() {
      const { data: photos } = await supabase.from('photos').select()

      if (photos) {
        setPhotos(photos)
      }
    }

    getPhotos()
  }, [])

  return (
    <main className={styles.app}>
      <ul className={styles.list}>
        {photos.map((photo, index) => (
          <Face key={index} photo={photo} />
        ))}
      </ul>
    </main>
  )
}