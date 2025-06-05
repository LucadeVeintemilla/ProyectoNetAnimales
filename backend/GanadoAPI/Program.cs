using System.Text;
using GanadoAPI.Data;
using GanadoAPI.Models;
using GanadoAPI.Models.Identity;
using GanadoAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Configuración para evitar que la aplicación se recicle por inactividad
builder.WebHost.ConfigureKestrel(options => {
    // Aumentar tiempo de inactividad a 2 horas
    options.Limits.KeepAliveTimeout = TimeSpan.FromHours(2);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(5);
});

// Add services to the container.

// Configuración de CORS
var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: MyAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:3000")
                                .AllowAnyHeader()
                                .AllowAnyMethod()
                                .AllowCredentials();
                      });
});

// Configuración de la base de datos
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// Registrar DbInitializer
builder.Services.AddScoped<DbInitializer>();

// Configuración de Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => 
    {
        // Configuración de opciones de Identity
        options.Password.RequireDigit = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequiredLength = 8;
        
        // Configuración de bloqueo de cuenta
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(30);
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.AllowedForNewUsers = true;
        
        // Configuración de usuario
        options.User.RequireUniqueEmail = true;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// Configuración de autenticación
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = IdentityConstants.ApplicationScheme;
    options.DefaultChallengeScheme = IdentityConstants.ApplicationScheme;
    options.DefaultSignInScheme = IdentityConstants.ExternalScheme;
});

// Configuración de JWT
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        // Agregar un margen de tiempo para la expiración del token
        ClockSkew = TimeSpan.Zero
    };
    
    // Configurar eventos para el token JWT
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context => Task.CompletedTask,
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError("Error de autenticación: {Error}", context.Exception.Message);
            return Task.CompletedTask;
        }
    };
});

// Configuración de CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        builder => builder
            .WithOrigins("http://localhost:3000") // Ajusta según tu frontend
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials());
});

// Configuración de controladores
builder.Services.AddControllers();

// Configuración de AutoMapper
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// Registrar servicios personalizados
builder.Services.AddScoped<AuthService>(provider => 
{
    var userManager = provider.GetRequiredService<UserManager<ApplicationUser>>();
    var signInManager = provider.GetRequiredService<SignInManager<ApplicationUser>>();
    var configuration = provider.GetRequiredService<IConfiguration>();
    var logger = provider.GetRequiredService<ILogger<AuthService>>();
    
    return new AuthService(userManager, signInManager, configuration, logger);
});

// Configuración de Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "GanadoAPI", Version = "v1" });
    
    // Configuración para JWT en Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

// Configuración del pipeline de solicitudes HTTP
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "GanadoAPI v1"));
}

app.UseHttpsRedirection();

// Asegurarse de que CORS está antes de otros middlewares
app.UseCors(MyAllowSpecificOrigins);

// Asegurarse de que el middleware de autenticación y autorización esté configurado
app.UseAuthentication();
app.UseAuthorization();

// Configuración de rutas
app.MapControllers();

// Crear la base de datos y aplicar migraciones al iniciar la aplicación
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        
        // Aplicar migraciones
        context.Database.Migrate();
        
        // Crear roles si no existen
        string[] roleNames = { "Administrador", "Usuario" };
        foreach (var roleName in roleNames)
        {
            var roleExist = await roleManager.RoleExistsAsync(roleName);
            if (!roleExist)
            {
                // Crear el rol
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database or creating roles.");
    }
}

// Initialize the database
await InitializeDatabase(app);

app.Run();

async Task InitializeDatabase(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    try
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await context.Database.MigrateAsync();
        
        var initializer = scope.ServiceProvider.GetRequiredService<DbInitializer>();
        await initializer.Initialize();
    }
    catch (Exception ex)
    {
        var logger = app.Services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
        throw; // Re-throw to fail the application startup
    }
}
