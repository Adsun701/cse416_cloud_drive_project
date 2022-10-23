import React from 'react';
import { Route, Routes } from 'react-router-dom';

import LoginPage from './pages/loginpage';
import SearchPage from './pages/searchpage';
import SnapshotPage from './pages/snapshotpage';

const App = () => (
  <div>
    <Routes>
      <Route exact path="/" element={<LoginPage />} />
      <Route exact path="/search/" element={<SearchPage />} />
      <Route exact path="/snapshot/" element={<SnapshotPage />} />
    </Routes>
  </div>
);

export default App;
