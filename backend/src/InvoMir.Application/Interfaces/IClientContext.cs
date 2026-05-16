namespace InvoMir.Application.Interfaces;

public interface IClientContext
{
    string? IpAddress { get; }
    string? DeviceInfo { get; }
}
