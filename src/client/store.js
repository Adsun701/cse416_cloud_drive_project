import create from "zustand";

export const useStore = create((set) => ({
  editPermission: false,
  setEditPermission: () => set((state) => ({ editPermission: !state.editPermission })),
}));