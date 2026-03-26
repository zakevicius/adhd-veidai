import { useState } from 'react';

import Hero from './components/Hero';
import Faces from './components/Faces';

import styles from './App.module.css';

import { VIEW_FACES, VIEW_HOME } from './utils/constants';

export default function App() {
	const [view, setView] = useState(VIEW_HOME);

	return (
		<main className={styles.app}>
			{view === VIEW_HOME && <Hero setView={setView} />}
			{view === VIEW_FACES && <Faces setView={setView} />}
		</main>
	);
}
