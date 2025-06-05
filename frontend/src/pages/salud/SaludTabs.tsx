import React, { useState, useEffect } from 'react';
import { Box, Tab, Tabs, useTheme } from '@mui/material';
import { 
  History as HistoryIcon, 
  AddCircle as AddCircleIcon, 
  Dashboard as DashboardIcon,
  Medication as MedicationIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const SaludTabs: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = useState(0);

  // Determinar la pestaña activa según la ruta
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/nuevo')) {
      setValue(1);
    } else if (path.includes('/dashboard')) {
      setValue(2);
    } else if (path.includes('/medicamentos')) {
      setValue(3);
    } else if (path.includes('/historial')) {
      setValue(0);
    }
  }, [location]);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    
    switch (newValue) {
      case 0:
        navigate('/salud/historial');
        break;
      case 1:
        navigate('/salud/nuevo');
        break;
      case 2:
        navigate('/salud/dashboard');
        break;
      case 3:
        navigate('/salud/medicamentos');
        break;
      default:
        navigate('/salud/historial');
    }
  };

  // Si estamos en una ruta específica, como un detalle o edición, mostrar Outlet en lugar de las pestañas
  if (location.pathname.match(/^\/salud\/\d+/) || location.pathname.match(/^\/salud\/\d+\/editar/)) {
    return <></>;
  }

  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={value} 
          onChange={handleChange} 
          aria-label="Pestañas de gestión de salud"
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab 
            icon={<HistoryIcon />} 
            label="Historial" 
            sx={{ 
              fontSize: '0.9rem',
              [theme.breakpoints.up('md')]: {
                fontSize: '1rem',
              },
            }} 
          />
          <Tab 
            icon={<AddCircleIcon />} 
            label="Nuevo Registro" 
            sx={{ 
              fontSize: '0.9rem',
              [theme.breakpoints.up('md')]: {
                fontSize: '1rem',
              },
            }} 
          />
          <Tab 
            icon={<DashboardIcon />} 
            label="Dashboard" 
            sx={{ 
              fontSize: '0.9rem',
              [theme.breakpoints.up('md')]: {
                fontSize: '1rem',
              },
            }} 
          />
          <Tab 
            icon={<MedicationIcon />} 
            label="Medicamentos" 
            sx={{ 
              fontSize: '0.9rem',
              [theme.breakpoints.up('md')]: {
                fontSize: '1rem',
              },
            }} 
          />
        </Tabs>
      </Box>
    </Box>
  );
};

export default SaludTabs;
