using AutoMapper;
using GanadoAPI.DTOs;
using GanadoAPI.Models;

namespace GanadoAPI.Mappings
{
    public class AutoMapperProfiles : Profile
    {
        public AutoMapperProfiles()
        {
            // Mapeos para Animal
            CreateMap<Animal, AnimalDTO>();
            CreateMap<AnimalCreacionDTO, Animal>();
            CreateMap<Animal, AnimalDetalleDTO>()
                .ForMember(dest => dest.Raza, opt => opt.MapFrom(src => src.Raza.Nombre));

            // Mapeos para Raza
            CreateMap<Raza, RazaDTO>().ReverseMap();
            CreateMap<RazaCreacionDTO, Raza>();

            // Mapeos para ProduccionLeche
            CreateMap<ProduccionLeche, ProduccionLecheDTO>()
    .ForMember(dest => dest.NombreAnimal, opt => opt.MapFrom(src => src.Animal.Nombre))
    .ForMember(dest => dest.NumeroIdentificacion, opt => opt.MapFrom(src => src.Animal.NumeroIdentificacion));
            CreateMap<ProduccionLecheCreacionDTO, ProduccionLeche>();

            // Mapeos para ControlSalud
            CreateMap<ControlSalud, ControlSaludDTO>()
                .ForMember(dest => dest.AnimalNombre, opt => opt.MapFrom(src => src.Animal.Nombre))
                .ForMember(dest => dest.AnimalIdentificacion, opt => opt.MapFrom(src => src.Animal.NumeroIdentificacion));
            CreateMap<ControlSaludCreacionDTO, ControlSalud>();

            // Mapeos para Reproduccion
            CreateMap<Reproduccion, ReproduccionDTO>()
                .ForMember(dest => dest.HembraNombre, opt => opt.MapFrom(src => src.Hembra.Nombre))
                .ForMember(dest => dest.HembraIdentificacion, opt => opt.MapFrom(src => src.Hembra.NumeroIdentificacion))
                .ForMember(dest => dest.MachoNombre, opt => opt.MapFrom(src => src.Macho != null ? src.Macho.Nombre : null))
                .ForMember(dest => dest.MachoIdentificacion, opt => opt.MapFrom(src => src.Macho != null ? src.Macho.NumeroIdentificacion : null));
            CreateMap<ReproduccionCreacionDTO, Reproduccion>();

            // Mapeos para Venta
            CreateMap<Venta, VentaDTO>()
                .ForMember(dest => dest.AnimalNombre, opt => opt.MapFrom(src => src.Animal.Nombre))
                .ForMember(dest => dest.AnimalIdentificacion, opt => opt.MapFrom(src => src.Animal.NumeroIdentificacion));
            CreateMap<VentaCreacionDTO, Venta>();

            // Mapeos para RegistroAlimentacion
            CreateMap<RegistroAlimentacion, RegistroAlimentacionDTO>()
                .ForMember(dest => dest.AnimalNombre, opt => opt.MapFrom(src => src.Animal.Nombre))
                .ForMember(dest => dest.AnimalIdentificacion, opt => opt.MapFrom(src => src.Animal.NumeroIdentificacion));
            CreateMap<RegistroAlimentacionCreacionDTO, RegistroAlimentacion>();

            // Mapeos para GastoSalud
            CreateMap<GastoSalud, GastoSaludDTO>()
                .ForMember(dest => dest.AnimalNombre, opt => opt.MapFrom(src => src.Animal.Nombre))
                .ForMember(dest => dest.AnimalIdentificacion, opt => opt.MapFrom(src => src.Animal.NumeroIdentificacion));
            CreateMap<GastoSaludCreacionDTO, GastoSalud>();

            // Mapeos para OtroGasto
            CreateMap<OtroGasto, OtroGastoDTO>();
            CreateMap<OtroGastoCreacionDTO, OtroGasto>();
        }
    }
}
