using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GanadoAPI.DTOs;
using GanadoAPI.Models.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace GanadoAPI.Services
{
    public class AuthService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration,
            ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<UserDTO> RegisterAsync(RegisterDTO model)
        {
            try
            {
                var user = new ApplicationUser
                {
                    UserName = model.Email,
                    Email = model.Email,
                    NombreCompleto = model.NombreCompleto,
                    EmailConfirmed = true,
                    Activo = true  // Ensure new users are active by default
                };

                var result = await _userManager.CreateAsync(user, model.Password);

                if (!result.Succeeded)
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    throw new Exception($"Error al crear el usuario: {errors}");
                }

                // Asignar rol 'Administrador' por defecto
                await _userManager.AddToRoleAsync(user, "Administrador");

                // Generar token JWT
                var token = await GenerateJwtToken(user);

                return new UserDTO
                {
                    Id = user.Id,
                    NombreCompleto = user.NombreCompleto,
                    Email = user.Email,
                    Token = new JwtSecurityTokenHandler().WriteToken(token)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el registro de usuario");
                throw;
            }
        }

        public async Task<UserDTO> LoginAsync(LoginDTO model)
        {
            try
            {
                // First verify if user exists
                var user = await _userManager.FindByEmailAsync(model.Email);
                
                if (user == null)
                {
                    _logger.LogWarning("Intento de inicio de sesión fallido: Usuario no encontrado con email {Email}", model.Email);
                    throw new Exception("Credenciales inválidas");
                }
                
                // Check if user is active
                if (!user.Activo)
                {
                    _logger.LogWarning("Intento de inicio de sesión fallido: Usuario {Email} inactivo", model.Email);
                    throw new Exception("La cuenta de usuario está desactivada. Contacte al administrador.");
                }
                
                // Try to sign in
                var result = await _signInManager.PasswordSignInAsync(
                    model.Email, model.Password, model.RememberMe, lockoutOnFailure: false);

                if (!result.Succeeded)
                {
                    _logger.LogWarning("Intento de inicio de sesión fallido para el usuario {Email}", model.Email);
                    
                    if (result.IsLockedOut)
                    {
                        throw new Exception("La cuenta ha sido bloqueada temporalmente debido a múltiples intentos fallidos. Intente nuevamente más tarde.");
                    }
                    
                    if (result.IsNotAllowed)
                    {
                        throw new Exception("No se permite el inicio de sesión para esta cuenta. Verifique su correo electrónico para confirmar su cuenta.");
                    }
                    
                    throw new Exception("Correo electrónico o contraseña incorrectos");
                }

                // Actualizar último acceso
                user.UltimoAcceso = DateTime.UtcNow;
                await _userManager.UpdateAsync(user);

                // Generar token JWT
                var token = await GenerateJwtToken(user);

                return new UserDTO
                {
                    Id = user.Id,
                    NombreCompleto = user.NombreCompleto,
                    Email = user.Email,
                    Token = new JwtSecurityTokenHandler().WriteToken(token)
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el inicio de sesión");
                throw;
            }
        }

        public async Task<UserDTO> GetUserByIdAsync(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return null;
                }

                return new UserDTO
                {
                    Id = user.Id,
                    NombreCompleto = user.NombreCompleto,
                    Email = user.Email,
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener el usuario por ID");
                throw;
            }
        }

        private async Task<JwtSecurityToken> GenerateJwtToken(ApplicationUser user)
        {
            var userRoles = await _userManager.GetRolesAsync(user);
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            };

            // Agregar roles al token
            foreach (var userRole in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));
            }

            var authSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                expires: DateTime.UtcNow.AddHours(12),
                claims: authClaims,
                signingCredentials: new SigningCredentials(
                    authSigningKey, SecurityAlgorithms.HmacSha256)
            );

            return token;
        }
    }
}
