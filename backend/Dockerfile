# ─── Stage 1: build ──────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /repo

# Copy the full source tree so all project references resolve correctly.
# The API project references sibling projects two levels up via ..\..\
COPY src/ src/

# Restore using the API csproj (which pulls in all referenced projects transitively)
RUN dotnet restore src/InvoMir.API/InvoMir.API/InvoMir.API.csproj

# Publish in Release mode; output to /app/publish
RUN dotnet publish src/InvoMir.API/InvoMir.API/InvoMir.API.csproj \
      -c Release \
      --no-restore \
      -o /app/publish

# ─── Stage 2: runtime ────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Required native libraries:
# - libwkhtmltox.so dependencies for DinkToPdf (PDF generation)
# - libkrb5-3 for libgssapi_krb5.so.2 (Kerberos/GSSAPI, needed by .NET crypto/networking stack)
RUN apt-get update \
      && apt-get install -y --no-install-recommends \
      libgdiplus \
      libx11-6 \
      libxext6 \
      libxrender1 \
      libfontconfig1 \
      libssl-dev \
      libkrb5-3 \
      && rm -rf /var/lib/apt/lists/*

# Copy the publish output from the build stage
COPY --from=build /app/publish .

# Railway routes traffic via its proxy; the app must listen on 0.0.0.0
# Use Railway's injected PORT if present, fallback to 8080 otherwise
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} dotnet InvoMir.API.dll"]