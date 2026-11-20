import { AUTH_ERRORS } from '@/constants/authErrors';
import { authService, AuthError } from '@/services/auth/authService';
import type { AuthState } from '@/types/auth';
import type { AuthSession } from '@/types/user';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

const restored = authService.restoreSession();

const initialState: AuthState = restored
  ? {
      isAuthenticated: true,
      user: restored.user,
      role: restored.role,
      permissions: restored.permissions,
      status: 'succeeded',
      error: null,
    }
  : {
      isAuthenticated: false,
      user: null,
      role: null,
      permissions: [],
      status: 'idle',
      error: null,
    };

function applySession(state: AuthState, session: AuthSession) {
  state.isAuthenticated = true;
  state.user = session.user;
  state.role = session.role;
  state.permissions = session.permissions;
  state.status = 'succeeded';
  state.error = null;
}

function resetSession(state: AuthState) {
  state.isAuthenticated = false;
  state.user = null;
  state.role = null;
  state.permissions = [];
  state.status = 'idle';
  state.error = null;
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await authService.login(payload.email, payload.password);
    } catch (error) {
      const message = error instanceof AuthError ? error.message : AUTH_ERRORS.unexpected;
      return rejectWithValue(message);
    }
  },
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionApplied(state, action: PayloadAction<AuthSession>) {
      applySession(state, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        applySession(state, action.payload);
      })
      .addCase(loginUser.rejected, (state, action) => {
        resetSession(state);
        state.status = 'failed';
        state.error = typeof action.payload === 'string' ? action.payload : AUTH_ERRORS.unexpected;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        resetSession(state);
      });
  },
});

export const { sessionApplied } = authSlice.actions;
export const authReducer = authSlice.reducer;
