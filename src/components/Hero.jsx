import Profile from '../assets/profile.jpg';

import styles from './Hero.module.css';

const Hero = () => {
	return (
		<div className={styles.container}>
			<div className={styles.text}>
				<h1>ADHD Veidai</h1>
			</div>
			<img className={styles.image} src={Profile} alt='Profile' />
		</div>
	);
};

export default Hero;
