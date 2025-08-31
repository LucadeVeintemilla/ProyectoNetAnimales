# Sistema de Gestión Ganadera

Bienvenido al sistema de gestión ganadera. Este proyecto consta de un backend desarrollado en .NET 9.0 y un frontend desarrollado con React y Material-UI.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu sistema:

- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js](https://nodejs.org/) (versión 16 o superior)
- [MySQL Server](https://dev.mysql.com/downloads/mysql/) (o alguna herramienta como XAMPP que incluya MySQL)
- [Git](https://git-scm.com/) (opcional, pero recomendado)

## Configuración del Backend

### 1. Configuración de la Base de Datos

1. Asegúrate de tener MySQL Server en ejecución.
2. Crea una nueva base de datos llamada `GanadoDB` (o el nombre que prefieras).
3. Actualiza la cadena de conexión en el archivo `backend/GanadoAPI/appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=tu_servidor;Database=GanadoDB;User=tu_usuario;Password=tu_contraseña;"
   }
   ```

### 2. Instalación de dependencias

1. Navega al directorio del backend:
   ```bash
   cd backend/GanadoAPI
   ```

2. Restaura los paquetes NuGet:
   ```bash
   dotnet restore
   ```

### 3. Aplicar migraciones

Ejecuta los siguientes comandos desde el directorio `backend/GanadoAPI`:

```bash
dotnet ef database update
```

### 4. Ejecutar el servidor de desarrollo

```bash
dotnet run
```

El backend estará disponible en `https://localhost:5001` y `http://localhost:5000`.

## Configuración del Frontend

### 1. Instalación de dependencias

1. Navega al directorio del frontend:
   ```bash
   cd frontend
   ```

2. Instala las dependencias de Node.js:
   ```bash
   npm install
   ```

### 2. Configuración

Asegúrate de que la URL de la API en el frontend coincida con la URL de tu backend. Normalmente, esto se configura en un archivo de entorno o en un archivo de configuración de la API.

### 3. Ejecutar la aplicación en modo desarrollo

```bash
npm start
```

Esto abrirá automáticamente tu navegador predeterminado en `http://localhost:3000`.

## Estructura del Proyecto

```
ProyectoNet/
├── backend/
│   └── GanadoAPI/           # API de .NET Core
│       ├── Controllers/     # Controladores de la API
│       ├── Data/            # Contexto de base de datos y configuración
│       ├── Models/          # Modelos de datos
│       ├── Program.cs       # Punto de entrada de la aplicación
│       └── appsettings.json # Configuración de la aplicación
└── frontend/               # Aplicación React
    ├── public/             # Archivos estáticos
    └── src/                # Código fuente de React
        ├── components/     # Componentes reutilizables
        ├── pages/          # Páginas de la aplicación
        ├── services/       # Servicios para interactuar con la API
        └── App.tsx        # Componente principal de React
```

## Variables de Entorno

### Backend

- `ASPNETCORE_ENVIRONMENT`: Configura el entorno de ejecución (Development, Production, etc.)

### Frontend

- `REACT_APP_API_URL`: URL base de la API (por defecto: `http://localhost:5000`)

## Despliegue en Producción

### Backend

1. Publica la aplicación:
   ```bash
   dotnet publish -c Release -o ./publish
   ```

2. Despliega el contenido de la carpeta `publish` en tu servidor.

### Frontend

1. Crea una versión optimizada para producción:
   ```bash
   npm run build
   ```

2. Sirve los archivos generados en la carpeta `build` usando un servidor web como Nginx o Apache.

## Solución de Problemas

- **Problemas de conexión a la base de datos**: Verifica que MySQL esté en ejecución y que las credenciales en `appsettings.json` sean correctas.
- **Errores de migración**: Asegúrate de que la base de datos existe y el usuario tiene los permisos necesarios.
- **Problemas de CORS**: Verifica que las URLs permitidas en la configuración de CORS incluyan la URL de tu frontend.

## Contribución

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -am 'Añade nueva funcionalidad'`)
4. Haz push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.
