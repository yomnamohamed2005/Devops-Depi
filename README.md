# Angular Auth Dashboard

A simple Angular project with login, registration, and dashboard functionality.

## Features

- ✅ Login page with JWT authentication
- ✅ Registration page
- ✅ Real-time dashboard with statistics
- ✅ Route protection (Guards) with JWT token validation
- ✅ Modern and beautiful design
- ✅ Integration with ASP.NET Core Web API
- ✅ WebSocket support for real-time data
- ✅ Sensor data integration

## Prerequisites

- **Node.js**: Version 18.13.0 or higher (or Node.js 20+ recommended)
- **npm**: Version 9.0.0 or higher (comes with Node.js)

### Installing Node.js on Windows

1. **Download Node.js**:
   - Visit [https://nodejs.org/](https://nodejs.org/)
   - Download the LTS (Long Term Support) version (recommended: Node.js 20.x)
   - Run the installer and follow the installation wizard

2. **Verify Installation**:
   ```bash
   node --version
   npm --version
   ```

3. **Alternative: Using nvm-windows** (for managing multiple Node.js versions):
   - Download from [https://github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases)
   - After installation, run:
   ```bash
   nvm install 20
   nvm use 20
   ```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run the project:
```bash
npm start
```

3. Open your browser at:
```
http://localhost:4200
```

## Backend Integration (ASP.NET Core)

This Angular app is configured to work with ASP.NET Core Web API.

### API Configuration

1. **Update API URL** in `src/environments/environment.ts`:
   ```typescript
   apiUrl: 'https://localhost:7000/api' // Your ASP.NET Core API URL
   ```

2. **Backend Controllers Required**:
   - `AuthController` - `/api/auth/login` (POST)
   - `SensorController` - `/api/sensor-data` (POST, GET)

### API Endpoints

#### Authentication
- **POST** `/api/auth/login`
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
  Response:
  ```json
  {
    "token": "jwt_token_here",
    "expiration": "2024-01-01T12:00:00Z"
  }
  ```

#### Sensor Data
- **POST** `/api/sensor-data`
  ```json
  {
    "sensorId": "sensor001",
    "sensorType": "temperature",
    "value": 25.5,
    "timestamp": "2024-01-01T12:00:00Z",
    "location": "Building A"
  }
  ```

### CORS Configuration

Make sure your ASP.NET Core API allows CORS from Angular app:

```csharp
// In Program.cs or Startup.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

app.UseCors("AllowAngularApp");
```

## Usage

1. **Start ASP.NET Core API** (if using backend)
2. **Start Angular app**:
   ```bash
   npm start
   ```
3. **Login** using:
   - Username: `admin`
   - Password: `admin123`
4. **View real-time dashboard** with live statistics

## Structure

- `src/app/components/login/` - Login page with JWT authentication
- `src/app/components/register/` - Registration page
- `src/app/components/dashboard/` - Real-time dashboard
- `src/app/services/auth.service.ts` - JWT authentication service
- `src/app/services/sensor.service.ts` - Sensor data service
- `src/app/services/websocket.service.ts` - WebSocket/real-time data service
- `src/app/guards/auth.guard.ts` - JWT token validation guard
- `src/environments/` - Environment configuration files

## Notes

- JWT tokens are stored in localStorage
- Token expiration is automatically checked
- Falls back to local authentication if API is unavailable
- Real-time updates every 2 seconds
- You can customize the design and colors according to your needs

