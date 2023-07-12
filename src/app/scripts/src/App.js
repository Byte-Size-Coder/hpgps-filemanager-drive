import React, { useEffect, useState } from 'react';
import DocumentTable from './components/DocumentTable';

import { collection, query, where, getDocs } from 'firebase/firestore';

import { ref, getDownloadURL } from 'firebase/storage';

import { fbStorage, fbFirestore } from './utils/firebase';

import { Box, Button, Typography } from '@mui/material';

const App = ({ api, database, driver, device, trailer }) => {
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
        const q = query(
            collection(fbFirestore, database),
            where('tags', 'array-contains-any', [device, driver, ...trailer])
        );
        getDocs(q).then((snapshot) => {
            console.log(snapshot.docs);
            const fetchedFiles = [];
            snapshot.forEach((doc) => {
                const associated = [];

                doc.data().tags.forEach((tag) => {
                    if (tag === device) {
                        associated.push(device);
                    } else if (tag === driver) {
                        associated.push(driver);
                    } else {
                        trailer.forEach((t) => {
                            if (t === tag) {
                                associated.push(t);
                            }
                        });
                    }
                });

                fetchedFiles.push({
                    id: doc.id,
                    ...doc.data(),
                    associated,
                    action: (
                        <Button
                            variant="contained"
                            onClick={() => handleDownload(doc.data().path)}
                            sx={{ width: '100px' }}
                        >
                            View
                        </Button>
                    ),
                });
            });
            setFiles(fetchedFiles);
        });
    }, []);

    return (
        <Box id="HPGPS-drive" sx={{ height: '100vh', padding: '2rem' }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'column', md: 'row' },
                    gap: { sm: '1rem', md: '3rem' },
                }}
            >
                <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                    <Typography variant="h6">Driver: </Typography>
                    <Typography variant="h5">{driver}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                    <Typography variant="h6">Vehicle: </Typography>
                    <Typography variant="h5">{device ? device : 'none'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                    <Typography variant="h6">Trailer(s): </Typography>
                    <Typography variant="h5">
                        {trailer.length > 0 ? trailer.join(', ') : 'none'}
                    </Typography>
                </Box>
            </Box>
            <DocumentTable files={files} />
        </Box>
    );
};

export default App;
