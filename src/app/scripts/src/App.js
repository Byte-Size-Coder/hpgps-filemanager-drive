import React, { useEffect, useState } from 'react';
import DocumentTable from './components/DocumentTable';
import DocumentMobile from './components/DocumentMobile';

import { collection, query, where, getDocs } from 'firebase/firestore';

import { ref, getBlob } from 'firebase/storage';

import { fbStorage, fbFirestore, fbAuth } from './utils/firebase';

import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import { getAuth, signInAnonymously } from 'firebase/auth';

import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';

import { verifyDatabaseCode } from './utils/verifyDatabaseCode';

async function getContentByTags(ids) {
	// don't run if there aren't any ids or a path for the collection
	if (!ids || !ids.length) return [];

	const collectionPath = collection(fbFirestore, database);
	const batches = [];

	while (ids.length) {
		// firestore limits batches to 10
		const batch = ids.splice(0, 10);

		// add the batch request to to a queue
		batches.push(
			collectionPath
				.wh('tags', 'array-contains-any', [...batch])
				.getDocs()
				.then((results) => results)
		);
	}

	// after all of the data is fetched, return it
	return Promise.all(batches).then((content) => content.flat());
}

const App = ({ api, database, groups, driver, device, trailer }) => {
	const [files, setFiles] = useState([]);
	const [mobile, setMobile] = useState(false);
	const [codeValid, setCodeValid] = useState(null);

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
		const updateSize = () => setMobile(window.innerWidth < 1200);
		window.addEventListener('resize', updateSize);
		updateSize();
	
		// Step 1: Extract code from URL hash
		const hash = window.location.hash;
		const [_, queryString] = hash.split('?');
		let codeFromUrl = '';
	
		if (queryString) {
			const params = new URLSearchParams(queryString);
			codeFromUrl = params.get('code');
		}
	
		if (!codeFromUrl || !database) {
			console.warn('Missing code or database.');
			return;
		}
	
		// Step 2: Verify code
		const verifyAndFetch = async () => {
			const isValid = await verifyDatabaseCode(codeFromUrl, database, fbFirestore);
			if (!isValid) {
				console.warn('Invalid access code');
				setCodeValid(false);
				return;
			}

			setCodeValid(true);
	
			// Step 3: Sign in and fetch files
			try {
				await signInAnonymously(fbAuth);
	
				const queryTags = [device, driver, ...trailer, ...groups];
				if (queryTags.length === 0) return;
	
				const fetchedFiles = [];
				const batches = [];
	
				while (queryTags.length) {
					const batch = queryTags.splice(0, 30);
					const q = query(
						collection(fbFirestore, database),
						where('tags', 'array-contains-any', batch)
					);
	
					batches.push(
						getDocs(q).then((snapshot) => {
							snapshot.forEach((doc) => {
								if (doc.data().fileName) {
									const associated = [];
	
									doc.data().tags.forEach((tag) => {
										if (tag === device) associated.push(device);
										else if (tag === driver) associated.push(driver);
										if (trailer.includes(tag)) associated.push(tag);
										if (groups.includes(tag)) associated.push(tag);
									});
	
									fetchedFiles.push({
										id: doc.id,
										...doc.data(),
										associated,
										action: (
											<Tooltip sx={{ maxWidth: '40px' }} title="Open File">
												<IconButton
													onClick={() =>
														handleDownload(
															doc.data().path,
															doc.data().fileName
														)
													}
												>
													<OpenInNewRoundedIcon fontSize="large" color="primary" />
												</IconButton>
											</Tooltip>
										),
									});
								}
							});
						})
					);
				}
	
				Promise.all(batches).then(() => setFiles(fetchedFiles));
			} catch (error) {
				console.error('Error during anonymous sign-in or file fetch:', error);
			}
		};
	
		verifyAndFetch();
	
		return () => window.removeEventListener('resize', updateSize);
	}, []);

	return (
		<Box id="HPGPS-drive" sx={{ padding: '2rem' }}>
			{codeValid === null ? (
				<Box
				sx={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					height: '100vh',
				}}
				>	
					<Typography variant="h5">Verifying access...</Typography>
				</Box>
		) : (
			<>
				{codeValid === true ? (
				<>
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
						{mobile ? <DocumentMobile files={files} devices={[device]} drivers={[driver]} trailers={[...trailer]} groups={[...groups]}/> : <DocumentTable files={files} />}
				</>
				) : (
					<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						height: '100vh',
					}}
				>
					<Typography variant="h4" color="error">
						Invalid Access Code. You are not authorized to view these documents.
					</Typography>
				</Box>
				)}
			</>
		)}
		</Box>
	);
};

export default App;
