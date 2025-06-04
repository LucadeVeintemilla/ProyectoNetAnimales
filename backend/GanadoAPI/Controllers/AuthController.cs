using System.Security.Claims;
using System.Threading.Tasks;
using GanadoAPI.DTOs;
using GanadoAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace GanadoAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(AuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        /// <summary>
        /// Registra un nuevo usuario en el sistema
        /// </summary>
        /// <param name="model">Datos del usuario a registrar</param>
        /// <returns>Datos del usuario registrado con su token de autenticación</returns>
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult<UserDTO>> Register(RegisterDTO model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.RegisterAsync(model);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al registrar usuario");
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Inicia sesión en el sistema
        /// </summary>
        /// <param name="model">Credenciales de acceso</param>
        /// <returns>Datos del usuario con su token de autenticación</returns>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<UserDTO>> Login(LoginDTO model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var result = await _authService.LoginAsync(model);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error en el inicio de sesión");
                return Unauthorized(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Obtiene la información del usuario actual
        /// </summary>
        /// <returns>Datos del usuario autenticado</returns>
        [HttpGet("me")]
        [Authorize]
        public async Task<ActionResult<UserDTO>> GetCurrentUser()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var user = await _authService.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return NotFound(new { message = "Usuario no encontrado" });
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener información del usuario");
                return StatusCode(500, new { message = "Error interno del servidor" });
            }
        }
    }
}
