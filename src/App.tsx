import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import GenerateReport from './pages/GenerateReport';
import NewReport from './pages/NewReport';
import ReportDetail from './pages/ReportDetail';
import Equipment from './pages/Equipment';
import Parameters from './pages/Parameters';
import MultiPhase from './pages/MultiPhase';
import Reports from './pages/Reports';
import './index.css';

function App() {
  console.log('App component rendering...');
  
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/generate" element={<GenerateReport />} />
          <Route path="/new" element={<NewReport />} />
          <Route path="/report/:type/:id" element={<ReportDetail />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/parameters" element={<Parameters />} />
          <Route path="/multiphase" element={<MultiPhase />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
