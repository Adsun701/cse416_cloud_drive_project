import create from "zustand";

export const useStore = create((set) => ({
  editPermission: false,
  selectedFiles: [],
  setEditPermission: () => set((state) => ({ editPermission: !state.editPermission })),
  setSelectedFiles: (files) => set((state) => ({ selectedFiles: files }))
}));