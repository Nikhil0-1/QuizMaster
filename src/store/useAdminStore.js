// src/store/useAdminStore.js
import { create } from 'zustand';

const useAdminStore = create((set) => ({
  user: null,
  isLoading: false,
  activeTab: 'dashboard',
  editingQuestion: null,
  uploadStatus: null,  // null | 'uploading' | 'success' | 'error'

  setUser: (user) => set({ user }),
  setLoading: (v) => set({ isLoading: v }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setEditingQuestion: (q) => set({ editingQuestion: q }),
  setUploadStatus: (s) => set({ uploadStatus: s }),
}));

export default useAdminStore;
