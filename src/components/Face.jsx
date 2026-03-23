const Face = ({ photo }) => {
	return (
		<div>
			<h1>{`${photo.name}, ${photo.age}`}</h1>
			<img src={photo.url} alt={photo.name} />
		</div>
	);
};

export default Face;
