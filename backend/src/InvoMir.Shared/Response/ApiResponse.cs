namespace InvoMir.Shared.Response;

public sealed class ApiResponse<T>
{
    public bool Success { get; private init; }
    public T? Data { get; private init; }
    public string? Message { get; private init; }
    public IReadOnlyList<string> Errors { get; private init; } = [];

    public static ApiResponse<T> Ok(T data, string? message = null)
    {
        return new ApiResponse<T>
        {
            Success = true,
            Data = data,
            Message = message
        };
    }

    public static ApiResponse<T> Fail(string message)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Message = message,
            Errors = [message]
        };
    }

    public static ApiResponse<T> Fail(IEnumerable<string> errors)
    {
        var errorList = errors.Where(error => !string.IsNullOrWhiteSpace(error)).ToList();

        return new ApiResponse<T>
        {
            Success = false,
            Message = errorList.Count == 0 ? "Request failed." : errorList[0],
            Errors = errorList
        };
    }
}
