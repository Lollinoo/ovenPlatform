// Main application component that sets up routing
// Configures the application's navigation structure with conditional routes based on environment
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import StreamsPage from './components/StreamsPage';
import PlayerPage from './components/PlayerPage';
import EnvDebugger from './components/EnvDebugger';
import config from './utils/envConfig';
import './styles/theme.css';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <div className="content-container">
          <Routes>
            <Route path="/" element={<StreamsPage />} />
            <Route path="/player/:streamName" element={<PlayerPage />} />
            {!config.app.isProduction && (
              <Route path="/env-debug" element={<EnvDebugger />} />
            )}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
