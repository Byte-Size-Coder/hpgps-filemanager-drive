import { doc, getDoc } from 'firebase/firestore';

/**
 * Verifies that a given code matches the stored code in database_users/{database}
 *
 * @param {string} code - The code to verify from the URL
 * @param {string} database - The document ID in the `database_users` collection
 * @param {object} fbFirestore - Your Firestore instance
 * @returns {Promise<boolean>} - True if valid, false otherwise
 */
export async function verifyDatabaseCode(code, database, fbFirestore) {
	if (!code || !database || !fbFirestore) return false;

	try {
		const userDocRef = doc(fbFirestore, 'database_users', database);
		const userDocSnap = await getDoc(userDocRef);

		if (!userDocSnap.exists()) {
			console.warn('Database user not found');
			return false;
		}

		const userData = userDocSnap.data();
		return userData.code === code;
	} catch (err) {
		console.error('Code verification failed:', err);
		return false;
	}
}