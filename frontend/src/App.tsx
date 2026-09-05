import React from 'react';
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Fleet } from './pages/Fleet';
import { Routes } from './pages/Routes';
import { Predictions } from './pages/Predictions';
import { Optimization } from './pages/Optimization';
import { Benchmarks } from './pages/Benchmarks';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-white text-[#0A1628] flex flex-col font-sans">
      {/* Subtle blue ambient warmth */}
      <div className="fixed top-0 right-1/4 w-[600px] h-[600px] bg-[#2563EB]/[0.03] rounded-full blur-[140px] pointer-events-none" />

      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative bg-white">
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <RouterRoutes>
        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
        <Route path="/fleet"     element={<Layout><Fleet /></Layout>} />
        <Route path="/routes"    element={<Layout><Routes /></Layout>} />
        <Route path="/predictions" element={<Layout><Predictions /></Layout>} />
        <Route path="/optimization" element={<Layout><Optimization /></Layout>} />
        <Route path="/benchmarks" element={<Layout><Benchmarks /></Layout>} />
        <Route path="/analytics"  element={<Layout><Analytics /></Layout>} />
        <Route path="/settings"   element={<Layout><Settings /></Layout>} />

        {/* Default route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </RouterRoutes>
    </BrowserRouter>
  );
};

export default App;
