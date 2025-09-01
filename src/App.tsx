import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import Dividends from './pages/Dividends';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/dividends" element={<Dividends />} />
        </Routes>
      </Layout>
      <SpeedInsights />
    </Router>
  );
}

export default App