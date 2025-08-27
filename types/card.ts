export interface BusinessCard {
  id: string;
  name: string | null;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  notes: string | null;
  eventId: string | null;
  createdAt: string;
  linkedinUrl: string | null;
  profilePhotoUrl: string | null;
}

export interface Event {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  color: string;
}