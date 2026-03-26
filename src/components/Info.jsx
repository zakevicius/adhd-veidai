const Info = ({ photo }) => {
	return (
		<div>
			<h1>{`${photo.name}, ${photo.age}`}</h1>
		</div>
	);
};

export default Info;
