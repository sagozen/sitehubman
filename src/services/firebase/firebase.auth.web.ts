import { Auth, getAuth } from 'firebase/auth';
import { app } from '@/src/services/firebase/firebase.shared';

export const auth: Auth | null = app ? getAuth(app) : null;
