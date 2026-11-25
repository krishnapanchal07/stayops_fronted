import { authReducer, sessionApplied, sessionExpired } from '@/store/slices/authSlice';
import { subscribeSession } from '@/services/auth/session';
import { uiReducer } from '@/store/slices/uiSlice';
import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
  },
});

subscribeSession((session) => {
  store.dispatch(session ? sessionApplied(session) : sessionExpired());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
