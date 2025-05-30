import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-blue-50/30 to-purple-50/20 dark:from-surface-900 dark:via-surface-800 dark:to-surface-900">
      <Routes>
        <Route path="/" element={<Home />} />
<Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        className="mt-16"
        toastClassName="backdrop-blur-sm"
      />
    </div>
  )
}

export default App