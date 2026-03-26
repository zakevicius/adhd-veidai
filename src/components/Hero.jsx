import Profile from '../assets/profile.jpg';

import styles from './Hero.module.css';

import { VIEW_FACES } from '../utils/constants';

const Hero = ({ setView }) => {
	return (
		<div className={styles.container}>
			<div className={styles.text}>
				<div>
					<h1>adhd</h1>
					<h1>VEIDAI</h1>
				</div>
				<div>
					<button className={styles.button} onClick={() => setView(VIEW_FACES)}>
						Pradėti
					</button>
				</div>
			</div>
			<img className={styles.image} src={Profile} alt='Profile' />
		</div>
	);
};

export default Hero;
