import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';

export const getAboutInfo = async () => {
  try {
    const docRef = doc(db, 'config', 'about');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return {};
  } catch (e) {
    console.error(e);
    return {};
  }
};

export const updateAboutInfo = async (data: any) => {
  try {
    const docRef = doc(db, 'config', 'about');
    const { id, ...cleanData } = data;
    await updateDoc(docRef, cleanData).catch(async (err) => {
      if (err.code === 'not-found') {
        const { setDoc } = await import('firebase/firestore');
        await setDoc(docRef, cleanData);
      } else {
        throw err;
      }
    });
  } catch (e) {
    handleFirestoreError(e, 'update', 'config/about');
  }
};

export const getProjects = async (max: number = 100) => {
  try {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'), limit(max));
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (results.length === 0) {
      // Fallback: fetch without order
      const snap = await getDocs(collection(db, 'projects'));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return results;
  } catch (e) {
    console.error("Error fetching projects, trying fallback:", e);
    try {
      const snap = await getDocs(collection(db, 'projects'));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      handleFirestoreError(err, 'list', 'projects');
    }
  }
};

export const getVolunteers = async () => {
  try {
    const q = query(collection(db, 'volunteers'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    const snap = await getDocs(collection(db, 'volunteers'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

export const getSurveys = async () => {
  try {
    const q = query(collection(db, 'surveys'), orderBy('submittedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    const snap = await getDocs(collection(db, 'surveys'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

export const getGallery = async () => {
  try {
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    const snap = await getDocs(collection(db, 'gallery'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

export const getBeneficiaries = async () => {
  try {
    const q = query(collection(db, 'beneficiaries'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    const snap = await getDocs(collection(db, 'beneficiaries'));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
};

export const addProject = async (data: any) => {
  try {
    await addDoc(collection(db, 'projects'), { ...data, createdAt: Timestamp.now() });
  } catch (e) {
    handleFirestoreError(e, 'create', 'projects');
  }
};

export const getEvents = async (max: number = 100) => {
  try {
    const q = query(collection(db, 'events'), orderBy('date', 'asc'), limit(max));
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (results.length === 0) {
      const snap = await getDocs(collection(db, 'events'));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return results;
  } catch (e) {
    console.error("Error fetching events:", e);
    try {
      const snap = await getDocs(collection(db, 'events'));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      handleFirestoreError(err, 'list', 'events');
    }
  }
};

export const getNews = async (max: number = 100) => {
  try {
    const q = query(collection(db, 'news'), orderBy('publishedAt', 'desc'), limit(max));
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (results.length === 0) {
      const snap = await getDocs(collection(db, 'news'));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    return results;
  } catch (e) {
    console.error("Error fetching news:", e);
    try {
      const snap = await getDocs(collection(db, 'news'));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      handleFirestoreError(err, 'list', 'news');
    }
  }
};

export const getNewsItem = async (id: string) => {
  try {
    const docRef = doc(db, 'news', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as any;
    }
    return null;
  } catch (e) {
    handleFirestoreError(e, 'get', `news/${id}`);
    return null;
  }
};

export const submitVolunteerApplication = async (data: any) => {
  try {
    await addDoc(collection(db, 'volunteers'), { ...data, status: 'Pending', createdAt: Timestamp.now() });
  } catch (e) {
    handleFirestoreError(e, 'create', 'volunteers');
  }
};

export const submitSurveyResponse = async (data: any) => {
  try {
    await addDoc(collection(db, 'surveys'), { ...data, submittedAt: Timestamp.now() });
  } catch (e) {
    handleFirestoreError(e, 'create', 'surveys');
  }
};
