namespace InvoMir.Shared.Exceptions;

public sealed class BadRequestException(string message) : Exception(message);
