import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Navbar from './components/navbar';
import LoginPage from './pages/loginpage';
import SearchPage from './pages/searchpage';
import SnapshotPage from './pages/snapshotpage';

const App = () => (
  <div>
    <Navbar />
    <Routes>
      <Route exact path="/" element={<LoginPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/snapshot" element={<SnapshotPage />} />
    </Routes>
  </div>
);

export default App;
