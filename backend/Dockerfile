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

# Required native library for DinkToPdf (PDF generation)
# libwkhtmltox.so is published via CopyToOutputDirectory=Always in the csproj
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libgdiplus \
      libx11-6 \
      libxext6 \
      libxrender1 \
      libfontconfig1 \
      libssl-dev \
 && rm -rf /var/lib/apt/lists/*

# Copy the publish output from the build stage
COPY --from=build /app/publish .

# Railway routes traffic via its proxy; the app must listen on 0.0.0.0
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "InvoMir.API.dll"]
