import React, { useState } from 'react';
import { Context } from "./Context.js";

import { Route, Routes } from 'react-router-dom';

import LoginPage from './pages/loginpage';
import SearchPage from './pages/searchpage';
import SnapshotPage from './pages/snapshotpage';

const App = () => {
  const [context, setContext] = useState([]);
  return (
    <Context.Provider value={[context, setContext]}>
  <div>
    <Routes>
      <Route exact path="/" element={<LoginPage />} />
      <Route exact path="/search/" element={<SearchPage />} />
      <Route exact path="/snapshot/" element={<SnapshotPage />} />
    </Routes>
  </div>
  </Context.Provider>
  )
};

export default App;
