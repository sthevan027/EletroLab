import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import GenerateReport from './pages/GenerateReport';
import Parameters from './pages/Parameters';
import Equipment from './pages/Equipment';
import NewReport from './pages/NewReport';
import ReportDetail from './pages/ReportDetail';
import './index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/generate" element={<GenerateReport />} />
          <Route path="/parameters" element={<Parameters />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/new-report" element={<NewReport />} />
          <Route path="/report/:id" element={<ReportDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
