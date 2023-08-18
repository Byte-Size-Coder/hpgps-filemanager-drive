import React, { useEffect, useState } from 'react';
import DocumentTable from './components/DocumentTable';
import DocumentMobile from './components/DocumentMobile';

import { collection, query, where, getDocs } from 'firebase/firestore';

import { ref, getBlob } from 'firebase/storage';

import { fbStorage, fbFirestore } from './utils/firebase';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import { getAuth, signInAnonymously } from 'firebase/auth';

import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';

const App = ({ api, database, groups, driver, device, trailer }) => {
	const [files, setFiles] = useState([]);
	const [mobile, setMobile] = useState(false);

	const handleDownload = (filePath, fileName) => {
		const storageRef = ref(fbStorage, filePath);
		getBlob(storageRef)
			.then((blob) => {
				let link = document.createElement('a');
				link.href = window.URL.createObjectURL(blob);
				link.download = fileName;
				link.click();
			})
			.catch((error) => console.log(error));
	};

	useEffect(() => {
		const auth = getAuth();
		function updateSize() {
			setMobile(window.innerWidth < 1200);
		}
		window.addEventListener('resize', updateSize);
		updateSize();
		signInAnonymously(auth).then(() => {
			const queryTags = [device, driver, ...trailer, ...groups];
			const q = query(
				collection(fbFirestore, database),
				where('tags', 'array-contains-any', queryTags)
			);
			getDocs(q)
				.then((snapshot) => {
					console.log(snapshot.docs);
					const fetchedFiles = [];
					snapshot.forEach((doc) => {
						const associated = [];

						doc.data().tags.forEach((tag) => {
							if (tag === device) {
								associated.push(device);
							} else if (tag === driver) {
								associated.push(driver);
							}

							trailer.forEach((t) => {
								if (t === tag) {
									associated.push(t);
								}
							});

							groups.forEach((g) => {
								if (g === tag) {
									associated.push(g);
								}
							});
						});

						fetchedFiles.push({
							id: doc.id,
							...doc.data(),
							associated,
							action: (
								<Tooltip sx={{ maxWidth: '40px' }} title="Open File">
									<IconButton
										onClick={() =>
											handleDownload(doc.data().path, doc.data().fileName)
										}
									>
										<OpenInNewRoundedIcon fontSize="large" color="primary" />
									</IconButton>
								</Tooltip>
							),
						});
					});
					setFiles(fetchedFiles);
				})
				.catch((error) => {
					console.error(error);
				});
		});
		return () => window.removeEventListener('resize', updateSize);
	}, []);
	return (
		<Box id="HPGPS-drive" sx={{ padding: '2rem' }}>
			<Box
				sx={{
					display: 'flex',
					flexDirection: { xs: 'column', sm: 'column', md: 'row' },
					gap: { xs: '2rem', sm: '2rem', md: '3rem' },
				}}
			>
				<Box sx={{ display: 'flex', gap: '0.5rem' }}>
					<Typography variant="h4">Groups: </Typography>
					<Typography variant="h4">{groups.join(', ')}</Typography>
				</Box>
				<Box sx={{ display: 'flex', gap: '0.5rem' }}>
					<Typography variant="h4">Driver: </Typography>
					<Typography variant="h4">{driver}</Typography>
				</Box>
				<Box sx={{ display: 'flex', gap: '0.5rem' }}>
					<Typography variant="h4">Vehicle: </Typography>
					<Typography variant="h4">{device ? device : 'none'}</Typography>
				</Box>
				<Box sx={{ display: 'flex', gap: '0.5rem' }}>
					<Typography variant="h4">Trailer(s): </Typography>
					<Typography variant="h4">
						{trailer.length > 0 ? trailer.join(', ') : 'none'}
					</Typography>
				</Box>
			</Box>
			{mobile ? <DocumentMobile files={files} /> : <DocumentTable files={files} />}
		</Box>
	);
};

export default App;
