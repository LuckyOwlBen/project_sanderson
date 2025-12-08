# Sanderson RPG - Character Management System

Web-based character creator and session manager for tabletop RPG sessions. Built with Angular 18 and Node.js.

## 🚀 Quick Start

**Production (Recommended):**
```bash
npm install && cd server && npm install && cd ..
./start.sh
```

Access at `http://sanderson-rpg.local:3000` or `http://<mini-pc-ip>:3000`

**See [QUICKSTART.md](QUICKSTART.md) for full reference**

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Commands and common tasks
- **[STARTUP.md](STARTUP.md)** - Detailed startup options and systemd setup
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment, Docker, network config

## ✨ Features

- **Character Creation Wizard**: Ancestry → Culture → Attributes → Skills → Paths → Talents
- **Character Sheet**: Live gameplay view with resource tracking
- **Session Management**: Notes, resource tracking, auto-save
- **Multi-User**: Multiple devices connect to single host
- **Persistent Storage**: JSON file-based character database
- **Network Discovery**: Access by hostname (mDNS/Avahi)

## 🏗️ Architecture

- **Frontend**: Angular 18 (standalone components, Material Design)
- **Backend**: Express.js (~200 lines, minimal API)
- **Storage**: JSON files (no database required)
- **Deployment**: Single-process production mode or Docker

## Development

To start development servers with hot reload:

```bash
./start.sh dev
```

Frontend: `http://localhost:4200`  
Backend: `http://localhost:3000`

## 🐳 Docker

Optional containerized deployment:

```bash
docker-compose up -d
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

## 🌐 Network Setup

**Enable hostname access (`sanderson-rpg.local`):**
```bash
sudo apt-get install avahi-daemon
sudo hostnamectl set-hostname sanderson-rpg
sudo systemctl enable avahi-daemon
```

## 🔧 Tech Stack

- **Angular 18** - Standalone components, signals
- **Angular Material** - UI components
- **Node.js 18+** - Backend runtime
- **Express.js** - REST API
- **TypeScript** - Type safety
- **RxJS** - Reactive programming

## 📱 Supported Devices

- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Tablets (iPad, Android tablets)
- Mobile phones (iOS, Android)

## 🧪 Testing

```bash
ng test
```

## 📦 Building for Production

```bash
npm run build:prod
```

Output: `dist/project-sanderson/browser/` (~600KB)

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
