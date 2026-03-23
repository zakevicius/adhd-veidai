import { useState } from 'react';

import Hero from './components/Hero';
import Faces from './components/Faces';

import styles from './App.module.css';

export default function App() {
	const [continueToFaces, setContinueToFaces] = useState(false);

	return (
		<main className={styles.app}>
			<Hero />
			{continueToFaces && <Faces />}
		</main>
	);
}
