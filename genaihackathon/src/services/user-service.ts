import { doc, setDoc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';


export type UserProfile = {
  id: string;
  email: string;
  name: string;
  education?: string;
  jobPreferences?: string;
  skills?: string[];
  resumeUrl?: string;
  psychometricTestAnswer?: string;
  oralFluencyAnswer?: string;
  learningPreference?: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  digitalTwin?: {
    description: string;
  };
  [key: string]: any;
};


export async function createUserProfile(userId: string, data: Partial<UserProfile>) {
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, data, { merge: true });
    return { success: true, path: userDocRef.path };
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw new Error('Could not create or update user profile.');
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      console.log('No such document for user:', userId);
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error('Could not get user profile.');
  }
}

export function onUserProfileChange(userId: string, callback: (profile: UserProfile | null) => void): Unsubscribe {
  const docRef = doc(db, 'users', userId);
  
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserProfile);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error listening to user profile:', error);
    throw new Error('Could not listen to user profile changes.');
  });
  
  return unsubscribe;
}


export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Could not upload file.');
  }
}

export async function uploadDataUri(dataUri: string, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadString(storageRef, dataUri, 'data_url');
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading data URI:', error);
    throw new Error('Could not upload data URI.');
  }
}
