// Add type declaration for the openpgp object from the CDN script
// FIX: Wrapped 'openpgp' declaration in 'declare global' to make it available application-wide, as it is loaded from a CDN.
declare global {
    const openpgp: any;
}

export type SharedPermission = 'view' | 'edit';

export interface SharedWith {
    email: string;
    permission: SharedPermission;
}

export type Entry = {
  id: string;
  title: string;
  username: string;
  password_encrypted: string;
  url: string;
  notes: string;
  tags: string[];
  folder: string;
  sharedWith?: SharedWith[];
};

export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  folder: string;
  sharedWith?: SharedWith[];
};

export type FidoKey = {
  id: string;
  name: string;
  addedOn: string;
};

export type PgpKey = {
  publicKey: string;
  keyId: string;
  fingerprint: string;
};

export type Theme = 'light' | 'dark';

// FIX: Add UserView and AdminViewType to be used across the application.
export type UserView = 'overview' | 'all-entries' | 'notes' | 'settings';
export type AdminViewType = 'overview' | 'management';

export type User = {
    id: string;
    email: string;
    role: 'admin' | 'user';
    status: 'active' | 'suspended';
    lastLogin: string;
};