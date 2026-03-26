import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

import Face from './Face';
import Info from './Info';

import styles from './Faces.module.css';

import { VIEW_HOME } from '../utils/constants';

const Faces = ({ setView }) => {
	const [photos, setPhotos] = useState([]);

	useEffect(() => {
		async function getPhotos() {
			const { data: photos } = await supabase.from('photos').select();

			if (photos) {
				setPhotos(photos);
			}
		}

		getPhotos();
	}, []);

	return (
		<div>
			<button onClick={() => setView(VIEW_HOME)}> {'<<<'} </button>
			{photos.map((photo, index) => (
				<div className={styles.faces} key={index}>
					<Face photo={photo} />
					<Info photo={photo} />
				</div>
			))}
		</div>
	);
};

export default Faces;
