# InvoMir Mobile

Expo React Native app for the InvoMir SaaS workspace.

## Development

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm run start
```

For Expo Go on a physical iOS or Android device, run the backend with the LAN profile:

```bash
cd ../../backend/src/InvoMir.API/InvoMir.API
dotnet run --launch-profile mobile-http
```

Then start Expo in LAN mode and keep the phone on the same Wi-Fi network as the computer. The mobile app uses the same backend API contracts as the web app. In native Expo Go, a configured `http://localhost:5299` API URL is resolved to the Expo dev machine host so the phone can call `http://<your-computer-ip>:5299`.

If you use an Expo tunnel or a remote device outside your local network, set `extra.apiBaseUrl` in `app.json` to a reachable public backend URL.

## Validation

```bash
npx tsc --noEmit
npx eslint . --max-warnings=0
```
