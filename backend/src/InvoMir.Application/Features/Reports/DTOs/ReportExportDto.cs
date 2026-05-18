namespace InvoMir.Application.Features.Reports.DTOs;

public sealed record ReportExportDto(
    byte[] Content,
    string FileName,
    string ContentType);
