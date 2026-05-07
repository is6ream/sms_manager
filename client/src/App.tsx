import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import RoutesPage from './pages/RoutesPage';
import ImportPage from './pages/ImportPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <ChatProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/routes" replace />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/import" element={<ImportPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ChatProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
}
