import styles from './Face.module.css'

const Face = ({ photo }) => {
  return (
    <li className={styles.container}>
      <h1 className={styles.title}>{`${photo.name}, ${photo.age}`}</h1>
      <img className={styles.image} src={photo.url} alt={photo.name} />
    </li>
  )
}

export default Face