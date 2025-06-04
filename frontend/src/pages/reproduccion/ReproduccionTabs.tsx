import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, Tab, Box, Typography } from '@mui/material';
import { CalendarMonth, ListAlt, Timeline, Add } from '@mui/icons-material';
import { ReproduccionList } from './ReproduccionList';
import { PartosProximos } from './PartosProximos';
import { EstadisticasReproduccion } from './EstadisticasReproduccion';
import ReproduccionFormPage from './ReproduccionFormPage';

type TabValue = 'listado' | 'proximos' | 'estadisticas' | 'nuevo';

const tabConfig = [
  { id: 'listado', label: 'Listado', icon: <ListAlt /> },
  { id: 'proximos', label: 'Próximos Partos', icon: <CalendarMonth /> },
  { id: 'estadisticas', label: 'Estadísticas', icon: <Timeline /> },
  { id: 'nuevo', label: 'Nuevo Evento', icon: <Add /> },
];

export const ReproduccionTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabValue>('listado');

  // Update active tab based on URL
  useEffect(() => {
    const path = location.pathname.split('/').pop() || 'listado';
    if (path === 'reproduccion') {
      setActiveTab('listado');
    } else if (path === 'proximos-partos') {
      setActiveTab('proximos');
    } else if (path === 'estadisticas') {
      setActiveTab('estadisticas');
    } else if (path === 'nuevo') {
      setActiveTab('nuevo');
    }
  }, [location]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
    navigate(`/reproduccion/${newValue === 'listado' ? '' : newValue}`);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="reproduccion tabs"
        sx={{
          mb: 3,
          '& .MuiTabs-indicator': {
            height: 4,
            borderRadius: '4px 4px 0 0',
          },
        }}
      >
        {tabConfig.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            icon={tab.icon}
            iconPosition="start"
            label={tab.label}
            sx={{
              textTransform: 'none',
              fontWeight: 'medium',
              fontSize: '0.875rem',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 'bold',
              },
            }}
          />
        ))}
      </Tabs>

      <Box sx={{ py: 2 }}>
        {activeTab === 'listado' && <ReproduccionList />}
        {activeTab === 'proximos' && <PartosProximos />}
        {activeTab === 'estadisticas' && <EstadisticasReproduccion />}
        {activeTab === 'nuevo' && <ReproduccionFormPage />}
      </Box>
    </Box>
  );
};

export default ReproduccionTabs;
