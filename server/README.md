# Sanderson RPG Character Server

Minimal Node.js backend for character storage.

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Start the server:
```bash
npm start
```

Server runs on port 3000 by default.

## API Endpoints

- `POST /api/characters/save` - Save character
- `GET /api/characters/list` - List all characters
- `GET /api/characters/load/:id` - Load specific character
- `DELETE /api/characters/delete/:id` - Delete character
- `GET /api/health` - Health check

## Storage

Characters are stored as JSON files in `server/characters/` directory.

## Configuration

Set `PORT` environment variable to change the port:
```bash
PORT=3001 npm start
```

## Angular Frontend Configuration

Update `src/app/services/character-storage.service.ts`:

Change:
```typescript
private apiUrl = '/api/characters';
```

To:
```typescript
private apiUrl = 'http://localhost:3000/api/characters';
```

And update the `isServerAvailable()` method to return `true`.
