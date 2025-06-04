using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GanadoAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BaseApiController : ControllerBase
    {
        protected string UserId => User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        protected string UserEmail => User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        protected string UserName => User.Identity?.Name;
        
        protected IActionResult HandleResult<T>(T result, string notFoundMessage = "No se encontró el recurso solicitado")
        {
            if (result == null) return NotFound(new { message = notFoundMessage });
            return Ok(result);
        }
    }
}
