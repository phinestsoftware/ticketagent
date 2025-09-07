import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TicketMappings from './pages/TicketMappings'
import DeviceLogs from './pages/DeviceLogs'
import Tickets from './pages/Tickets'
import EsimProfiles from './pages/EsimProfiles'
import Setup from './pages/Setup'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="ticket-mappings" element={<TicketMappings />} />
          <Route path="device-logs" element={<DeviceLogs />} />
          <Route path="tickets" element={<Tickets />} />
          <Route path="esim-profiles" element={<EsimProfiles />} />
          <Route path="setup" element={<Setup />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
