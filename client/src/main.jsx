import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, NavLink, Outlet } from 'react-router-dom';

import Patients from './pages/Patients.jsx';
import PatientDetail from './pages/PatientDetail.jsx';

import './styles/derma-ui.css';   // <- Asegúrate de que este path exista

function Layout() {
  return (
    <div>
      <header className="dui-appbar">
        <div className="dui-appbar__inner dui-container">
          <h1 className="dui-appbar__title">Dermatología MVP</h1>
          <nav className="dui-appbar__nav">
            <NavLink to="/" end className={({isActive}) => `dui-navlink ${isActive ? '-active':''}`}>
              Pacientes
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="dui-main">
        <Outlet />
      </main>
    </div>
  );
}

const router = createBrowserRouter([
  { path: '/', element: <Layout />, children: [
    { index: true, element: <Patients /> },
    { path: 'patient/:id', element: <PatientDetail /> },
  ]},
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
