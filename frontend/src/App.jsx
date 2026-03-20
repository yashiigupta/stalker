import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import About from './pages/About';
import Contact from './pages/Contact';
import StoryPresentation from './pages/StoryPresentation';

// Wraps routes to provide current location to AnimatePresence
const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/story" element={<StoryPresentation />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <Router>
      {/* Global Background Elements */}
      <div className="noise-overlay" />
      <div className="ambient-glow" />
      <div className="ambient-glow-alt" />
      
      {/* Navigation */}
      <Navbar />

      {/* Pages */}
      <AnimatedRoutes />
    </Router>
  );
};

export default App;
