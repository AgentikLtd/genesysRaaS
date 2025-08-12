# Genesys Cloud Rules Engine Manager

A production-ready React application providing a sophisticated visual and JSON-based interface for managing call routing rules in Genesys Cloud contact centers. Rules are stored directly in Genesys Data Tables and executed via the json-rules-engine framework.

## Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Genesys Cloud Organization** with administrator access
- **OAuth Client** configured for Implicit Grant flow
- **Data Tables** created in Genesys Cloud:
  - Rules table for storing rule configurations
  - Logs table for execution history (optional)
- **Genesys Cloud Permissions:**
  - `architect:datatable:view`
  - `architect:datatable:add` 
  - `architect:datatable:edit`
  - `architect:datatable:delete`

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   # Create .env file with your Genesys Cloud configuration
   # See Environment Variables section below for required values
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

**Required:**
- `VITE_GENESYS_ENVIRONMENT`: Genesys Cloud environment URL (e.g., `mypurecloud.com`, `mypurecloud.ie`)
- `VITE_GENESYS_CLIENT_ID`: OAuth client ID from your Implicit Grant client
- `VITE_REDIRECT_URI`: OAuth redirect URI (must match client configuration)
- `VITE_RULES_TABLE_ID`: UUID of the Data Table storing rules configurations

**Optional:**
- `VITE_LOGS_TABLE_ID`: UUID of the Data Table for execution logs
- `VITE_DEFAULT_RULE_PRIORITY`: Default priority for new rules (default: 50)

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

## Core Features

### Rule Management
- **Dual Editor Interface**: Monaco JSON editor with syntax highlighting + React Flow visual designer
- **Advanced Validation**: Real-time JSON syntax and semantic validation with detailed error reporting
- **Template System**: Comprehensive library of pre-built rule templates for common scenarios
- **Rule Testing**: Client-side json-rules-engine simulation with detailed execution analysis

### Visual Rule Builder
- **React Flow Integration**: Interactive flowchart interface with drag-and-drop node manipulation
- **Custom Node Types**: Rule headers, fact conditions, logical operators, and event actions
- **Auto-layout**: Dagre-based automatic node positioning with manual override capability
- **Minimap Navigation**: Overview panel for large rule flows

### Version Control & Deployment
- **Complete Version History**: Full audit trail with rollback capabilities
- **Version Cleanup**: Bulk deletion of old versions with active version protection
- **Deployment Tracking**: Detailed deployment logs with user attribution
- **Immediate Deployment**: Changes take effect immediately upon successful deployment

### Authentication & Security
- **Genesys Cloud OAuth 2.0**: Secure authentication with automatic token refresh
- **Session Management**: Persistent sessions with recovery across browser restarts
- **Input Validation**: Protection against XSS, prototype pollution, and ReDoS attacks
- **Secure Storage**: Rules stored in customer's own Genesys Data Tables

## Technical Architecture

### Frontend Framework
- **React 18** with **TypeScript** for type safety and modern React patterns
- **Vite** for fast development builds and HMR
- **React Router DOM v6** for client-side routing with protected routes

### UI/UX Libraries
- **Ant Design v5** - Complete UI component system with custom theming
- **@ant-design/icons** - Comprehensive icon set
- **Monaco Editor** - VS Code-powered JSON editor with IntelliSense
- **React Flow v11** - Interactive node-based visual editor

### Data Management
- **Genesys PureCloud SDK** - Direct API integration with Genesys Cloud
- **Axios** - HTTP client with request/response interceptors
- **Immer** - Immutable state updates for complex data structures
- **UUID** - Unique identifier generation
- **Lodash** - Utility functions
- **Day.js** - Date/time manipulation

### Development & Build
- **ESLint** - Code linting with TypeScript integration
- **TypeScript v5** - Static type checking
- **Vite Plugins** - React Fast Refresh and TypeScript support

### Deployment & Infrastructure
- **Docker** - Multi-stage containerized builds
- **Nginx** - Production web server with security headers
- **Google Cloud Run** - Serverless container deployment

## Security Implementation

### Authentication
- **OAuth 2.0 Implicit Grant** with Genesys Cloud Identity Provider
- **Automatic Token Refresh** with configurable refresh intervals
- **Secure Token Storage** with Base64 encoding and secure storage options
- **Session Recovery** maintaining state across browser sessions

### Application Security
- **Input Validation** preventing XSS and injection attacks
- **Prototype Pollution Protection** in rule evaluation engine
- **ReDoS Protection** against Regular Expression Denial of Service
- **Content Security Policy** headers via Nginx configuration
- **HTTPS Enforcement** in production with secure headers

### Data Security
- **Customer Data Sovereignty** - Rules stored in customer's Genesys organization
- **API Security** - All communications via authenticated Genesys Cloud APIs
- **No Data Persistence** - Application is stateless, no customer data stored locally

## Application Structure

### Key Components

- **`AuthProvider`** - Centralized OAuth authentication state management
- **`RulesEditor`** - Main editor component with JSON/Visual modes
- **`VisualRuleEditor`** - React Flow-based visual rule builder
- **`RuleSimulator`** - Client-side json-rules-engine implementation
- **`VersionHistory`** - Version management with rollback capabilities
- **`TemplateManager`** - Rule template system with variable substitution
- **`HelpWiki`** - Comprehensive user documentation

### Project Structure
```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── editors/         # Rule editor components
│   ├── templates/       # Template management
│   └── common/          # Shared components
├── contexts/            # React contexts (Auth, Theme)
├── hooks/               # Custom React hooks
├── services/            # API service layer
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── styles/              # Global styles and themes
```

## API Integration

### Genesys Cloud APIs Used

1. **OAuth Token Endpoint** - Authentication and token refresh
2. **Data Tables API** - CRUD operations for rules storage
   - `GET /api/v2/flows/datatables/{tableId}/rows` - Retrieve rules
   - `POST /api/v2/flows/datatables/{tableId}/rows` - Create new rules
   - `PUT /api/v2/flows/datatables/{tableId}/rows/{rowId}` - Update rules
   - `DELETE /api/v2/flows/datatables/{tableId}/rows/{rowId}` - Delete rules
3. **Users API** - User profile information for audit trails

### Data Table Schema

**Rules Table:**
- `id` (Primary Key) - Rule identifier
- `name` - Rule display name  
- `content` - JSON rule configuration
- `version` - Version number
- `created_by` - Creator user ID
- `created_date` - Creation timestamp
- `is_active` - Active version flag

## Development Guidelines

### Code Standards
- **TypeScript strict mode** enabled
- **ESLint configuration** for code quality
- **Component naming** using PascalCase
- **Hook naming** prefixed with `use`
- **Service functions** using camelCase

### State Management
- **React Context** for global state (authentication, theme)
- **useState/useReducer** for component-level state
- **Immer** for complex state updates
- **Custom hooks** for reusable logic

### Error Handling
- **Error Boundaries** for component-level error recovery
- **Try-catch blocks** in async operations
- **User-friendly error messages** with suggested actions
- **Console logging** for debugging (development only)

## Deployment Architecture

### Docker Configuration
- **Multi-stage build** optimizing production image size
- **Nginx reverse proxy** with security headers
- **Non-root user** for security
- **Health check endpoint** for container orchestration

### Environment Configuration
- **Development**: Vite dev server with HMR
- **Production**: Static build served via Nginx
- **Docker**: Containerized production deployment
- **Cloud Run**: Serverless auto-scaling deployment

## Monitoring and Maintenance

### Application Monitoring
- **Console error tracking** (implement external monitoring as needed)
- **Performance metrics** via browser dev tools
- **User analytics** via deployment logs
- **Token expiry tracking** with automatic refresh

### Maintenance Tasks
- **Dependency updates** - Regular npm audit and updates
- **Security patches** - Monitor for vulnerabilities
- **Genesys SDK updates** - Keep API client updated
- **Browser compatibility** - Test across supported browsers

## Known Limitations

1. **Analytics Dashboard** - Recharts included but analytics UI not implemented
2. **Execution Logs Viewing** - Log storage exists but viewing UI not built
3. **Bulk Import/Export** - No mass rule import/export functionality
4. **Multi-tenant Support** - Single organization implementation
5. **Real-time Collaboration** - No concurrent editing support

## Future Enhancement Opportunities

1. **Real-time Analytics** - Implement rule execution statistics
2. **Advanced Debugging** - Step-through rule evaluation
3. **Rule Performance Profiling** - Identify slow-performing rules
4. **Integration Testing** - End-to-end test automation
5. **Mobile Responsiveness** - Optimize for tablet/mobile usage