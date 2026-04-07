import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  nim: string;
  email: string;
  fakultas: string;
  role?: string;
  is_banned?: boolean;
  is_verified?:boolean;
}

interface Item {
  id: string;
  type: 'found' | 'lost';
  name: string;
  category: string;
  location: string;
  description: string;
  image_url?: string;
  status: 'active' | 'claimed';
  created_at: string;
  users?: { name: string; nim: string };
}

interface Store {
  user: User | null;
  items: Item[];
  setUser: (u: User | null) => void;
  setItems: (items: Item[]) => void;
}

export const useStore = create<Store>((set) => ({
  user: null,
  items: [],
  setUser: (user) => set({ user }),
  setItems: (items) => set({ items }),
}));