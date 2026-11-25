import App from '@/App';
import { store } from '@/store';
import { restoreUser } from '@/store/slices/authSlice';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import './index.css';

// Dispatch once outside React effects, including in StrictMode.
void store.dispatch(restoreUser());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
