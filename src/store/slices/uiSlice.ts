import type { ToastMessage, ToastVariant } from '@/types/ui';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  isSidebarCollapsed: boolean;
  isMobileNavOpen: boolean;
  toasts: ToastMessage[];
}

const initialState: UiState = {
  isSidebarCollapsed: true,
  isMobileNavOpen: false,
  toasts: [],
};

interface ShowToastPayload {
  variant: ToastVariant;
  title: string;
  description?: string;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebarCollapsed(state) {
      state.isSidebarCollapsed = !state.isSidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.isSidebarCollapsed = action.payload;
    },
    setMobileNavOpen(state, action: PayloadAction<boolean>) {
      state.isMobileNavOpen = action.payload;
    },
    showToast(state, action: PayloadAction<ShowToastPayload>) {
      state.toasts.push({
        id: `${Date.now()}-${state.toasts.length}`,
        ...action.payload,
      });
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
  },
});

export const {
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  setMobileNavOpen,
  showToast,
  dismissToast,
} = uiSlice.actions;

export const uiReducer = uiSlice.reducer;
