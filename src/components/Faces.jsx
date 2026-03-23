import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import styles from './Faces.module.css'

import Face from './Face'

export default function Faces() {
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
    <main className={styles.faces}>
        {photos.map((photo, index) => (
          <Face key={index} photo={photo} />
        ))}
    </main>
  )
}