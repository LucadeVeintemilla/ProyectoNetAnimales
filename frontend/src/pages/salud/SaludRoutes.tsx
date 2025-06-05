import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import SaludPage from './SaludPage';
import SaludDetallesPage from './SaludDetallesPage';
import SaludFormPage from './SaludFormPage';
import SaludHistorialPage from './SaludHistorialPage';
import SaludDashboardPage from './SaludDashboardPage';
import MedicamentosPage from './MedicamentosPage';

/**
 * Componente que gestiona las rutas para el módulo de salud
 */
const SaludRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<SaludPage />}>
        <Route index element={<Navigate to="/salud/historial" replace />} />
        <Route path="historial" element={<SaludHistorialPage />} />
        <Route path="nuevo" element={<SaludFormPage />} />
        <Route path="dashboard" element={<SaludDashboardPage />} />
        <Route path="medicamentos" element={<MedicamentosPage />} />
      </Route>
      <Route path="/:id" element={<SaludDetallesPage />} />
      <Route path="/:id/editar" element={<SaludFormPage isEditing />} />
      <Route path="*" element={<Navigate to="/salud/historial" replace />} />
    </Routes>
  );
};

export default SaludRoutes;
