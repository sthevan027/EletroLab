import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { initializeDatabase } from './db/database';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NewReport from './pages/NewReport';
import GenerateReport from './pages/GenerateReport';
import ReportDetail from './pages/ReportDetail';
import Equipment from './pages/Equipment';
import Parameters from './pages/Parameters';
import './index.css';

function App() {
  useEffect(() => {
    // Inicializar banco de dados
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new-report" element={<NewReport />} />
            <Route path="/generate" element={<GenerateReport />} />
            <Route path="/report/:id" element={<ReportDetail />} />
            <Route path="/equipment" element={<Equipment />} />
            <Route path="/parameters" element={<Parameters />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;
