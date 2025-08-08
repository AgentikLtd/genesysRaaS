# Genesys Rules Engine Web UI

Web-based management interface for the Genesys Cloud Rules Engine.

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Genesys Cloud OAuth client (Implicit Grant)
- Access to Genesys Data Tables

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Genesys configuration
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

### Environment Variables

- `VITE_GENESYS_ENVIRONMENT`: Your Genesys Cloud region (e.g., mypurecloud.com)
- `VITE_GENESYS_CLIENT_ID`: OAuth client ID (Implicit Grant)
- `VITE_REDIRECT_URI`: OAuth redirect URI
- `VITE_RULES_TABLE_ID`: Rules configuration Data Table ID
- `VITE_LOGS_TABLE_ID`: Execution logs Data Table ID

### Docker Deployment

```bash
# Build image
docker build -t rules-engine-ui .

# Run locally
docker run -p 8080:8080 rules-engine-ui
```

### Google Cloud Deployment

```bash
# Deploy to Cloud Run
gcloud run deploy rules-engine-ui \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Features

- Visual JSON editor with syntax highlighting
- Real-time rule validation
- Test rules before deployment
- Version history with rollback
- Execution logs and analytics
- Automatic token refresh

## Tech Stack

- React 18 with TypeScript
- Vite for fast builds
- Ant Design UI components
- Monaco Editor for JSON editing
- Recharts for analytics
- Axios with interceptors

## Security

- OAuth 2.0 Implicit Grant flow
- Automatic token refresh
- Session persistence
- Content Security Policy
- HTTPS only in production