# SaferMzansi

SaferMzansi is a mobile personal-safety application with an Express API. The
client supports offline access to local account data and emergency information,
while syncing supported records and evidence with the server when a connection
is available.

## Project structure

```text
.
├── client/       Expo and React Native mobile application
└── server/       Express API and automated tests
```

The mobile app includes emergency contacts, SOS dispatch, optional location
sharing and audio recording, an evidence vault, a decoy interface, and nearby
support-service lookup.

## Requirements

- Node.js 18 or newer
- npm
- An Expo-compatible Android or iOS development environment for device builds
- Supabase project credentials
- A Geoapify API key for nearby support-service search
- SMTP credentials if email alerts are required

## Configuration

Create `client/.env` with the Expo public variables used by the app:

```env
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
EXPO_PUBLIC_AES_256_SECRET_KEY=your-client-encryption-key
```

Set `EXPO_PUBLIC_API_URL` to the address where the server can be reached. For a
physical device, `localhost` points to the device itself; use a server address
reachable from that device.

Create `server/.env` from the supplied example:

```powershell
Copy-Item .\server\.env.example .\server\.env
```

Set the server values in `server/.env`:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (defaults to `8080`) |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase service role key |
| `JWT_SECRET_KEY` | Secret used to sign authentication tokens |
| `GEOAPIFY_API_KEY` | Nearby support-service search |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | SMTP settings for email alerts |
| `FROM_NAME`, `FROM_EMAIL` | Sender identity for email alerts |

Keep `.env` files private and out of source control. Do not put the Supabase
service role key in the client. The client uses only the Supabase publishable
key. The Supabase project should have the database tables and `EvidenceVault`
storage bucket expected by the server and client.

## Install dependencies

In separate terminal sessions, run:

```powershell
Set-Location .\server
npm install
```

```powershell
Set-Location .\client
npm install
```

## Run the application

Start the API in development mode:

```powershell
Set-Location .\server
npm run dev
```

Or run it without the development watcher:

```powershell
Set-Location .\server
npm start
```

Start the Expo development server:

```powershell
Set-Location .\client
npm start
```

Run directly on Android or iOS with the corresponding Expo native development
environment configured:

```powershell
Set-Location .\client
npm run android
```

```powershell
Set-Location .\client
npm run ios
```

## Checks

Run the server tests and lint:

```powershell
Set-Location .\server
npm test
npm run lint
```

Run client lint:

```powershell
Set-Location .\client
npm run lint
```

## Offline behavior

The app stores supported account data and evidence metadata in a local SQLite
database. Evidence files are cached on the device. Queued changes are synced
when connectivity is available; server-backed features such as email delivery,
nearby places, and cloud evidence storage require network access.
