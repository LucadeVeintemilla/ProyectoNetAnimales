import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  CircularProgress, 
  Alert,
  Button,
  Paper,
  Divider,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import animalesService from '../../services/animalService';
import reportesService, { ReporteDetalladoAnimal } from '../../services/reportesService';

interface Animal {
  id: number;
  numeroIdentificacion: string;
  nombre: string;
}

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
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AnimalDetailedReport: React.FC = () => {
  const [animales, setAnimales] = useState<Animal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReporteDetalladoAnimal | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  useEffect(() => {
    // Get list of animals for the dropdown
    const fetchAnimales = async () => {
      try {
        setLoading(true);
        const response = await animalesService.getAnimales();
        const animalList = response.items.map((animal: any) => ({
          id: animal.id,
          numeroIdentificacion: animal.numeroIdentificacion,
          nombre: animal.nombre
        }));
        setAnimales(animalList);
        setError(null);
      } catch (err) {
        setError('Error al cargar la lista de animales');
        console.error('Error fetching animals:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnimales();
  }, []);
  
  const handleAnimalChange = (event: any) => {
    setSelectedAnimalId(event.target.value);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleGenerateReport = async () => {
    if (selectedAnimalId) {
      try {
        setLoading(true);
        setError(null);
        const data = await reportesService.getReporteDetalladoAnimal(Number(selectedAnimalId));
        setReport(data);
      } catch (err) {
        setError('Error al generar el reporte del animal');
        console.error('Error generating animal report:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportReport = () => {
    if (!report) return;
    
    // Create a new PDF document
    const doc = new jsPDF();
    const lineHeight = 7;
    let y = 20; // Starting y position
    
    // Add title and header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`REPORTE DETALLADO DE ANIMAL - ${report.numeroIdentificacion} - ${report.nombre}`, 15, y);
    y += lineHeight * 1.5;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de generación: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 15, y);
    y += lineHeight * 1.5;
    
    // General data
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS GENERALES:', 15, y);
    y += lineHeight;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Identificación: ${report.numeroIdentificacion}`, 15, y); y += lineHeight;
    doc.text(`Nombre: ${report.nombre}`, 15, y); y += lineHeight;
    doc.text(`Fecha de nacimiento: ${report.fechaNacimiento ? format(new Date(report.fechaNacimiento), 'dd/MM/yyyy', { locale: es }) : '-'}`, 15, y); y += lineHeight;
    doc.text(`Edad: ${report.edadMeses} meses`, 15, y); y += lineHeight;
    doc.text(`Sexo: ${report.sexo}`, 15, y); y += lineHeight;
    doc.text(`Estado: ${report.estado}`, 15, y); y += lineHeight;
    doc.text(`Raza: ${report.razaNombre}`, 15, y); y += lineHeight;
    
    if (report.observaciones) {
      doc.text(`Observaciones: ${report.observaciones}`, 15, y);
      y += lineHeight;
    }
    
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    // Estado actual
    y += lineHeight;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO ACTUAL:', 15, y);
    y += lineHeight;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Estado actual: ${report.estadoActual}`, 15, y); y += lineHeight;
    doc.text(`En lactancia: ${report.enLactancia ? 'Sí' : 'No'}`, 15, y); y += lineHeight;
    doc.text(`En gestación: ${report.enGestacion ? 'Sí' : 'No'}`, 15, y); y += lineHeight;
    
    if (report.fechaUltimoControl) {
      doc.text(`Último control de salud: ${format(new Date(report.fechaUltimoControl), 'dd/MM/yyyy', { locale: es })}`, 15, y);
      y += lineHeight;
    }
    
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    // Genealogy
    y += lineHeight;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('GENEALOGÍA:', 15, y);
    y += lineHeight;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    if (report.padre) {
      doc.text(`Padre: ${report.padre.numeroIdentificacion} - ${report.padre.nombre}`, 15, y);
    } else {
      doc.text('Padre: No registrado', 15, y);
    }
    y += lineHeight;
    
    if (report.madre) {
      doc.text(`Madre: ${report.madre.numeroIdentificacion} - ${report.madre.nombre}`, 15, y);
    } else {
      doc.text('Madre: No registrada', 15, y);
    }
    y += lineHeight * 2;
    
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    // Production
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCCIÓN:', 15, y);
    y += lineHeight;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total producción de leche: ${report.totalProduccionLeche} litros`, 15, y); y += lineHeight;
    doc.text(`Promedio producción de leche: ${report.promedioProduccionLeche.toFixed(2)} litros`, 15, y); y += lineHeight;
    doc.text(`Peso promedio: ${report.pesoPromedio.toFixed(2)} kg`, 15, y); y += lineHeight * 2;
    
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    // Reproduction
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REPRODUCCIÓN:', 15, y);
    y += lineHeight;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total partos: ${report.totalPartos}`, 15, y); y += lineHeight;
    doc.text(`Total inseminaciones: ${report.totalInseminaciones}`, 15, y);
    
    // Save the PDF
    doc.save(`Reporte_${report.numeroIdentificacion}_${report.nombre}.pdf`);
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Seleccione un Animal
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="animal-select-label">Animal</InputLabel>
            <Select
              labelId="animal-select-label"
              id="animal-select"
              value={selectedAnimalId}
              label="Animal"
              onChange={handleAnimalChange}
              disabled={loading}
            >
              {animales.map((animal) => (
                <MenuItem key={animal.id} value={animal.id}>
                  {animal.numeroIdentificacion} - {animal.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button 
            variant="contained" 
            onClick={handleGenerateReport} 
            disabled={!selectedAnimalId || loading}
            startIcon={<SearchIcon />}
          >
            Generar Reporte
          </Button>
        </Box>
        
        {loading && <CircularProgress size={24} sx={{ mt: 2 }} />}
      </Box>
      
      {report && (
        <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              Reporte Detallado: {report.numeroIdentificacion} - {report.nombre}
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<FileDownloadIcon />} 
              onClick={handleExportReport}
            >
              Exportar Reporte
            </Button>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Datos Generales</Typography>
                  <Typography><strong>Identificación:</strong> {report.numeroIdentificacion}</Typography>
                  <Typography><strong>Nombre:</strong> {report.nombre}</Typography>
                  <Typography><strong>Fecha de nacimiento:</strong> {report.fechaNacimiento ? format(new Date(report.fechaNacimiento), 'dd/MM/yyyy', { locale: es }) : '-'}</Typography>
                  <Typography><strong>Edad:</strong> {report.edadMeses} meses</Typography>
                  <Typography><strong>Sexo:</strong> {report.sexo}</Typography>
                  <Typography><strong>Raza:</strong> {report.razaNombre}</Typography>
                  <Typography><strong>Estado:</strong> {report.estado}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Estado Actual</Typography>
                  <Typography><strong>Estado:</strong> {report.estadoActual}</Typography>
                  <Typography><strong>En lactancia:</strong> {report.enLactancia ? 'Sí' : 'No'}</Typography>
                  <Typography><strong>En gestación:</strong> {report.enGestacion ? 'Sí' : 'No'}</Typography>
                  {report.fechaUltimoControl && (
                    <Typography>
                      <strong>Último control de salud:</strong> {report.fechaUltimoControl ? format(new Date(report.fechaUltimoControl), 'dd/MM/yyyy', { locale: es }) : '-'}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="report tabs" 
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Genealogía" />
              <Tab label="Producción de Leche" />
              <Tab label="Producción de Carne" />
              <Tab label="Eventos Reproductivos" />
              <Tab label="Historial de Salud" />
            </Tabs>
          </Box>

          {/* Genealogy */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>Árbol Genealógico</Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1">Padre</Typography>
                    {report.padre ? (
                      <>
                        <Typography><strong>ID:</strong> {report.padre.numeroIdentificacion}</Typography>
                        <Typography><strong>Nombre:</strong> {report.padre.nombre}</Typography>
                        <Typography><strong>Sexo:</strong> {report.padre.sexo}</Typography>
                      </>
                    ) : (
                      <Typography>No registrado</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1">Madre</Typography>
                    {report.madre ? (
                      <>
                        <Typography><strong>ID:</strong> {report.madre.numeroIdentificacion}</Typography>
                        <Typography><strong>Nombre:</strong> {report.madre.nombre}</Typography>
                        <Typography><strong>Sexo:</strong> {report.madre.sexo}</Typography>
                      </>
                    ) : (
                      <Typography>No registrada</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {report.hijos.length > 0 && (
              <Box mt={3}>
                <Typography variant="h6" gutterBottom>Descendencia ({report.hijos.length})</Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Nombre</TableCell>
                        <TableCell>Sexo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {report.hijos.map(hijo => (
                        <TableRow key={hijo.id}>
                          <TableCell>{hijo.numeroIdentificacion}</TableCell>
                          <TableCell>{hijo.nombre}</TableCell>
                          <TableCell>{hijo.sexo}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </TabPanel>

          {/* Milk Production */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Producción de Leche</Typography>
              <Typography><strong>Total producción:</strong> {report.totalProduccionLeche} litros</Typography>
              <Typography><strong>Promedio producción:</strong> {report.promedioProduccionLeche.toFixed(2)} litros</Typography>
            </Box>

            {report.historialProduccionLeche.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Cantidad (litros)</TableCell>
                      <TableCell>Observaciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.historialProduccionLeche.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.fecha ? format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es }) : '-'}</TableCell>
                        <TableCell>{item.cantidadLitros}</TableCell>
                        <TableCell>{item.observaciones}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No hay registros de producción de leche</Typography>
            )}
          </TabPanel>

          {/* Meat Production */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Producción de Carne</Typography>
              <Typography><strong>Peso promedio:</strong> {report.pesoPromedio.toFixed(2)} kg</Typography>
            </Box>

            {report.historialProduccionCarne.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Peso (kg)</TableCell>
                      <TableCell>Observaciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.historialProduccionCarne.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.fecha ? format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es }) : '-'}</TableCell>
                        <TableCell>{item.peso}</TableCell>
                        <TableCell>{item.observaciones}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No hay registros de producción de carne</Typography>
            )}
          </TabPanel>

          {/* Reproductive Events */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>Eventos Reproductivos</Typography>
              <Typography><strong>Total partos:</strong> {report.totalPartos}</Typography>
              <Typography><strong>Total inseminaciones:</strong> {report.totalInseminaciones}</Typography>
            </Box>

            {report.eventosReproductivos.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha Servicio</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Fecha Parto</TableCell>
                      {report.sexo === 'Macho' ? <TableCell>Madre</TableCell> : <TableCell>Padre</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.eventosReproductivos.map(evento => (
                      <TableRow key={evento.id}>
                        <TableCell>{evento.fechaServicio ? format(new Date(evento.fechaServicio), 'dd/MM/yyyy', { locale: es }) : '-'}</TableCell>
                        <TableCell>{evento.tipoServicio}</TableCell>
                        <TableCell>{evento.estado}</TableCell>
                        <TableCell>
                          {evento.fechaRealParto ? format(new Date(evento.fechaRealParto), 'dd/MM/yyyy', { locale: es }) : '-'}
                        </TableCell>
                        {report.sexo === 'Macho' ? (
                          <TableCell>{evento.madreNumeroIdentificacion} - {evento.madreNombre}</TableCell>
                        ) : (
                          <TableCell>{evento.padreNumeroIdentificacion} - {evento.padreNombre}</TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No hay registros de eventos reproductivos</Typography>
            )}
          </TabPanel>

          {/* Health History */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h6" gutterBottom>Historial de Salud</Typography>
            
            {report.historialSalud.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Veterinario</TableCell>
                      <TableCell>Diagnóstico</TableCell>
                      <TableCell>Tratamiento</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.historialSalud.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.fecha ? format(new Date(item.fecha), 'dd/MM/yyyy', { locale: es }) : '-'}</TableCell>
                        <TableCell>{item.tipo}</TableCell>
                        <TableCell>{item.veterinario}</TableCell>
                        <TableCell>{item.diagnostico}</TableCell>
                        <TableCell>{item.tratamiento}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography>No hay registros de historial de salud</Typography>
            )}
          </TabPanel>
        </Paper>
      )}
    </Box>
  );
};

export default AnimalDetailedReport;
