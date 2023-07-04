import React, { useEffect, useState } from 'react';
import DocumentTable from './components/DocumentTable';

import { collection, query, where, getDocs } from 'firebase/firestore';

import { ref, getDownloadURL } from 'firebase/storage';

import { fbStorage, fbFirestore } from './utils/firebase';

const App = ({ database, driver, device, trailer }) => {
	const [files, setFiles] = useState([]);

	const handleDownload = (filePath) => {
		const storageRef = ref(fbStorage, filePath);
		getDownloadURL(storageRef)
			.then((url) => {
				window.open(url, '_blank');
			})
			.catch((error) => console.log(error));
	};

	useEffect(() => {
		console.log(driver);
		console.log(device);
		console.log(trailer);
		const q = query(
			collection(fbFirestore, database),
			where('tags', 'array-contains-any', [device, driver, trailer])
		);
		getDocs(q).then((snapshot) => {
			console.log(snapshot.docs);
			const fetchedFiles = [];
			snapshot.forEach((doc) => {
				fetchedFiles.push({
					id: doc.id,
					...doc.data(),
					action: (
						<div
							style={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
							}}
						>
							<button
								className="geot-button"
								onClick={() => handleDownload(doc.data().path)}
							>
								View
							</button>{' '}
						</div>
					),
				});
			});
			setFiles(fetchedFiles);
		});
	}, []);
	return <DocumentTable files={files} />;
};

export default App;
