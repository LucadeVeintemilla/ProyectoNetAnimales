import React, { useState, useEffect } from 'react';
import { 
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Button,
  TextField,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { es } from 'date-fns/locale';
import { format, subMonths } from 'date-fns';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import jsPDF from 'jspdf';
import reportesService, { ResumenProduccion } from '../../services/reportesService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ResumenGeneral: React.FC = () => {
  const [resumen, setResumen] = useState<ResumenProduccion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState<Date>(subMonths(new Date(), 3)); // Default: 3 months ago
  const [fechaFin, setFechaFin] = useState<Date>(new Date()); // Default: today

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const formattedFechaInicio = format(fechaInicio, 'yyyy-MM-dd');
      const formattedFechaFin = format(fechaFin, 'yyyy-MM-dd');
      
      const data = await reportesService.getResumenProduccion(formattedFechaInicio, formattedFechaFin);
      setResumen(data);
    } catch (err) {
      console.error('Error al generar el reporte:', err);
      setError('No se pudo generar el reporte. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Call API when component mounts to get initial data
  useEffect(() => {
    handleGenerateReport();
  }, []);

  const handleExportReport = () => {
    if (!resumen) return;
    
    // Create a PDF document
    const doc = new jsPDF();
    let y = 20;
    const lineHeight = 7;
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN GENERAL DE PRODUCCIÓN', 15, y);
    y += lineHeight * 1.5;
    
    // Dates
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de generación: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, 15, y);
    y += lineHeight;
    doc.text(`Período: ${format(fechaInicio, 'dd/MM/yyyy', { locale: es })} al ${format(fechaFin, 'dd/MM/yyyy', { locale: es })}`, 15, y);
    y += lineHeight * 2;
    
    // General statistics
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADÍSTICAS GENERALES', 15, y);
    y += lineHeight * 1.2;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de días: ${resumen.totalDias}`, 15, y); y += lineHeight;
    doc.text(`Total de animales: ${resumen.totalAnimales}`, 15, y); y += lineHeight;
    doc.text(`Total de hembras: ${resumen.totalHembras}`, 15, y); y += lineHeight;
    doc.text(`Total de machos: ${resumen.totalMachos}`, 15, y); y += lineHeight;
    doc.text(`Total producción de leche: ${resumen.produccionTotalLeche.toFixed(2)} litros`, 15, y); y += lineHeight;
    doc.text(`Promedio diario: ${resumen.promedioDiario.toFixed(2)} litros`, 15, y); y += lineHeight;
    doc.text(`Total partos: ${resumen.totalPartos}`, 15, y); y += lineHeight;
    doc.text(`Total nacimientos: ${resumen.totalNacimientos}`, 15, y); y += lineHeight;
    doc.text(`Total controles de salud: ${resumen.totalControlesSalud}`, 15, y); y += lineHeight * 2;
    
    // Distribution by breed
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DISTRIBUCIÓN POR RAZAS', 15, y);
    y += lineHeight * 1.2;
    
    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.text('Raza', 15, y);
    doc.text('Cantidad', 100, y);
    y += lineHeight;
    doc.setFont('helvetica', 'normal');
    
    // Table data
    resumen.distribucionPorRazas.forEach(raza => {
      doc.text(raza.nombre, 15, y);
      doc.text(raza.cantidadAnimales.toString(), 100, y);
      y += lineHeight;
      
      // Add new page if needed
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    
    y += lineHeight;
    
    // Monthly production if it fits on the page
    if (y < 200) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PRODUCCIÓN MENSUAL', 15, y);
      y += lineHeight * 1.2;
      
      // Table headers
      doc.setFont('helvetica', 'bold');
      doc.text('Mes', 15, y);
      doc.text('Año', 50, y);
      doc.text('Litros', 80, y);
      doc.text('Promedio Diario', 120, y);
      y += lineHeight;
      doc.setFont('helvetica', 'normal');
      
      // Table data (showing only the last 6 months if there are many)
      const monthsToShow = resumen.produccionMensual.slice(-6);
      monthsToShow.forEach(mes => {
        const monthName = format(new Date(mes.anio, mes.mes - 1, 1), 'MMMM', { locale: es });
        doc.text(monthName, 15, y);
        doc.text(mes.anio.toString(), 50, y);
        doc.text(mes.totalLitros.toFixed(2), 80, y);
        doc.text(mes.promedioDiario.toFixed(2), 120, y);
        y += lineHeight;
      });
    }
    
    // Save the PDF
    doc.save(`ResumenGeneral_${format(new Date(), 'ddMMyyyy')}.pdf`);
  };

  // Get months names for the chart
  const getMonthNameData = (data: ResumenProduccion | null) => {
    if (!data || !data.produccionMensual) return [];
    
    return data.produccionMensual.map(item => {
      const monthName = format(new Date(item.anio, item.mes - 1, 1), 'MMM', { locale: es });
      return {
        ...item,
        name: `${monthName} ${item.anio}`,
      };
    });
  };
  
  return (
    <Box>
      {/* Filter Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Seleccione el rango de fechas
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <DatePicker
              label="Fecha de inicio"
              value={fechaInicio}
              onChange={(newValue) => newValue && setFechaInicio(newValue)}
              slotProps={{ textField: { sx: { minWidth: '180px' } } }}
            />
            
            <DatePicker
              label="Fecha de fin"
              value={fechaFin}
              onChange={(newValue) => newValue && setFechaFin(newValue)}
              slotProps={{ textField: { sx: { minWidth: '180px' } } }}
            />
            
            <Button 
              variant="contained" 
              onClick={handleGenerateReport}
              disabled={loading}
              startIcon={<SearchIcon />}
            >
              Generar Reporte
            </Button>
          </Box>
        </LocalizationProvider>
        
        {loading && <CircularProgress size={24} sx={{ mt: 2 }} />}
      </Box>
      
      {/* Report Display */}
      {resumen && (
        <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h5">
              Resumen General
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<FileDownloadIcon />}
              onClick={handleExportReport}
            >
              Exportar Reporte
            </Button>
          </Box>
          
          <Grid container spacing={3}>
            {/* Key Statistics */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Estadísticas Generales</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Total días</Typography>
                      <Typography variant="body1">{resumen.totalDias}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Total animales</Typography>
                      <Typography variant="body1">{resumen.totalAnimales}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Hembras</Typography>
                      <Typography variant="body1">{resumen.totalHembras}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Machos</Typography>
                      <Typography variant="body1">{resumen.totalMachos}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Production Stats */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Estadísticas de Producción</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Producción total leche</Typography>
                      <Typography variant="body1">{resumen.produccionTotalLeche.toFixed(2)} litros</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Promedio diario</Typography>
                      <Typography variant="body1">{resumen.promedioDiario.toFixed(2)} litros</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Total partos</Typography>
                      <Typography variant="body1">{resumen.totalPartos}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Nacimientos</Typography>
                      <Typography variant="body1">{resumen.totalNacimientos}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Distribution by Breed */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent sx={{ height: '100%' }}>
                  <Typography variant="h6" gutterBottom>Distribución por Razas</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Raza</TableCell>
                          <TableCell align="right">Cantidad</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resumen.distribucionPorRazas.map((raza) => (
                          <TableRow key={raza.id}>
                            <TableCell component="th" scope="row">
                              {raza.nombre}
                            </TableCell>
                            <TableCell align="right">{raza.cantidadAnimales}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Monthly Production Chart */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Producción Mensual</Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getMonthNameData(resumen)}
                        margin={{
                          top: 5, right: 30, left: 20, bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="totalLitros" name="Litros totales" fill="#8884d8" />
                        <Bar dataKey="promedioDiario" name="Promedio diario" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Monthly Production Table */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Detalle de Producción Mensual</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Mes</TableCell>
                          <TableCell>Año</TableCell>
                          <TableCell align="right">Total Litros</TableCell>
                          <TableCell align="right">Promedio Diario</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resumen.produccionMensual.map((mes, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {format(new Date(mes.anio, mes.mes - 1, 1), 'MMMM', { locale: es })}
                            </TableCell>
                            <TableCell>{mes.anio}</TableCell>
                            <TableCell align="right">{mes.totalLitros.toFixed(2)}</TableCell>
                            <TableCell align="right">{mes.promedioDiario.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default ResumenGeneral;
