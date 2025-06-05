import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  TablePagination,
  DialogContentText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { saludService, MedicamentoInventario } from '../../services/saludService';

const MedicamentosPage: React.FC = () => {
  // Estados básicos
  const [loading, setLoading] = useState<boolean>(true);
  const [medicamentos, setMedicamentos] = useState<MedicamentoInventario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estado para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estado para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el modal de formulario
  const [openModal, setOpenModal] = useState(false);
  const [currentMedicamento, setCurrentMedicamento] = useState<MedicamentoInventario | null>(null);
  const [formValues, setFormValues] = useState({
    id: 0,
    nombre: '',
    descripcion: '',
    tipo: '',
    unidad: '',
    stock: 0,
    stockMinimo: 0,
    observaciones: ''
  });

  // Estado para el diálogo de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [medicamentoToDelete, setMedicamentoToDelete] = useState<number | null>(null);

  // Cargar medicamentos
  useEffect(() => {
    loadMedicamentos();
  }, []);

  const loadMedicamentos = async () => {
    try {
      setLoading(true);
      const data = await saludService.getMedicamentos();
      setMedicamentos(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar medicamentos:', err);
      setError('No se pudieron cargar los medicamentos. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar medicamentos por término de búsqueda
  const filteredMedicamentos = medicamentos.filter(med => 
    med.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (med.descripcion && med.descripcion.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (med.tipo && med.tipo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginación
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Manejo de eliminación
  const handleDeleteMedicamento = (id: number) => {
    setMedicamentoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMedicamento = async () => {
    if (medicamentoToDelete === null) return;
    
    try {
      setLoading(true);
      await saludService.deleteMedicamento(medicamentoToDelete);
      setMedicamentos(medicamentos.filter(med => med.id !== medicamentoToDelete));
      setSuccess('Medicamento eliminado correctamente');
      setDeleteDialogOpen(false);
      setMedicamentoToDelete(null);
    } catch (err) {
      console.error('Error al eliminar medicamento:', err);
      setError('No se pudo eliminar el medicamento. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Manejo del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: name === 'stock' || name === 'stockMinimo' 
        ? parseInt(value) || 0
        : value
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value as string;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };

  const handleSaveMedicamento = async () => {
    try {
      setLoading(true);
      
      if (currentMedicamento) {
        // Actualizar medicamento existente
        await saludService.updateMedicamento(formValues.id, formValues);
        setMedicamentos(medicamentos.map(med => 
          med.id === formValues.id ? { ...med, ...formValues } : med
        ));
        setSuccess('Medicamento actualizado correctamente');
      } else {
        // Crear nuevo medicamento
        const newMedicamento = await saludService.createMedicamento(formValues);
        setMedicamentos([...medicamentos, newMedicamento]);
        setSuccess('Medicamento creado correctamente');
      }
      
      setOpenModal(false);
    } catch (err) {
      console.error('Error al guardar medicamento:', err);
      setError('No se pudo guardar el medicamento. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Gestión de Medicamentos
      </Typography>
      
      {/* Barra de búsqueda y botón de agregar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Buscar por nombre, descripción o tipo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => {
                setCurrentMedicamento(null);
                setFormValues({
                  id: 0,
                  nombre: '',
                  descripcion: '',
                  tipo: '',
                  unidad: '',
                  stock: 0,
                  stockMinimo: 0,
                  observaciones: ''
                });
                setOpenModal(true);
              }}
            >
              Nuevo Medicamento
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Mensajes de alerta */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {/* Tabla de medicamentos */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="tabla de medicamentos">
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Unidad</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : filteredMedicamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No se encontraron medicamentos
                  </TableCell>
                </TableRow>
              ) : (
                filteredMedicamentos
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((medicamento) => (
                    <TableRow hover key={medicamento.id}>
                      <TableCell>{medicamento.nombre}</TableCell>
                      <TableCell>{medicamento.descripcion || '-'}</TableCell>
                      <TableCell>
                        {medicamento.tipo && (
                          <Chip 
                            label={medicamento.tipo} 
                            size="small"
                            color={
                              medicamento.tipo.toLowerCase() === 'vacuna' ? 'success' :
                              medicamento.tipo.toLowerCase() === 'antibiótico' ? 'primary' :
                              medicamento.tipo.toLowerCase() === 'antiparasitario' ? 'secondary' : 'default'
                            } 
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {medicamento.stock} {medicamento.unidad}
                        {medicamento.stock <= medicamento.stockMinimo && (
                          <Chip 
                            label="Stock bajo" 
                            size="small" 
                            color="warning" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </TableCell>
                      <TableCell>{medicamento.unidad}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={() => {
                            setCurrentMedicamento(medicamento);
                            setFormValues({
                              id: medicamento.id,
                              nombre: medicamento.nombre,
                              descripcion: medicamento.descripcion || '',
                              tipo: medicamento.tipo || '',
                              unidad: medicamento.unidad || '',
                              stock: medicamento.stock || 0,
                              stockMinimo: medicamento.stockMinimo || 0,
                              observaciones: medicamento.observaciones || ''
                            });
                            setOpenModal(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteMedicamento(medicamento.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredMedicamentos.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            ¿Está seguro de que desea eliminar este medicamento? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancelar
          </Button>
          <Button onClick={confirmDeleteMedicamento} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de formulario */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {currentMedicamento ? 'Editar Medicamento' : 'Nuevo Medicamento'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                name="nombre"
                value={formValues.nombre}
                onChange={handleInputChange}
                required
                error={!formValues.nombre}
                helperText={!formValues.nombre ? 'El nombre es requerido' : ''}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="descripcion"
                value={formValues.descripcion}
                onChange={handleInputChange}
                multiline
                rows={2}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="tipo-label">Tipo</InputLabel>
                <Select
                  labelId="tipo-label"
                  name="tipo"
                  value={formValues.tipo}
                  onChange={(e) => handleSelectChange(e as React.ChangeEvent<{ name?: string; value: unknown }>)}
                  label="Tipo"
                >
                  <MenuItem value=""><em>Ninguno</em></MenuItem>
                  <MenuItem value="Vacuna">Vacuna</MenuItem>
                  <MenuItem value="Antibiótico">Antibiótico</MenuItem>
                  <MenuItem value="Antiparasitario">Antiparasitario</MenuItem>
                  <MenuItem value="Analgésico">Analgésico</MenuItem>
                  <MenuItem value="Antiinflamatorio">Antiinflamatorio</MenuItem>
                  <MenuItem value="Otro">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unidad de medida"
                name="unidad"
                value={formValues.unidad}
                onChange={handleInputChange}
                margin="normal"
                placeholder="ml, mg, comprimidos, etc."
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock actual"
                name="stock"
                type="number"
                value={formValues.stock}
                onChange={handleInputChange}
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock mínimo"
                name="stockMinimo"
                type="number"
                value={formValues.stockMinimo}
                onChange={handleInputChange}
                margin="normal"
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Se alertará cuando el stock sea igual o menor a este valor"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observaciones"
                name="observaciones"
                value={formValues.observaciones}
                onChange={handleInputChange}
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveMedicamento} 
            color="primary" 
            variant="contained"
            disabled={!formValues.nombre}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicamentosPage;
