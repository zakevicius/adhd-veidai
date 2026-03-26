import styles from './Face.module.css';

const Face = ({ photo }) => {
	return (
		<div>
			<img src={photo.url} alt={photo.name} className={styles.image} />
		</div>
	);
};

export default Face;
