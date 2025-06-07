import React, { useState } from 'react';
import { Box, Typography, Container, Paper, Tabs, Tab, Divider } from '@mui/material';
import AnimalDetailedReport from './AnimalDetailedReport';
import ResumenGeneral from './ResumenGeneral';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ReportesPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ mt: 4, mb: 4 }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Reportes y Análisis
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="reportes tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Resumen General" />
              <Tab label="Reporte Detallado por Animal" />
            </Tabs>
          </Box>
          
          {/* Tab Panel Contents */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6">Resumen General</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Reporte general con estadísticas de la producción global
            </Typography>
            <ResumenGeneral />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6">Reporte Detallado por Animal</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Información detallada de un animal específico, incluyendo datos generales, producción, eventos reproductivos y salud
            </Typography>
            <AnimalDetailedReport />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default ReportesPage;
