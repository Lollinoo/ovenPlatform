# Environment Variable Management in OvenPlatform

This project uses a hierarchical system for managing environment variables, allowing flexible configuration for development, test, and production environments.

## Configuration File Structure

The system uses multiple `.env` files that are loaded in a specific order:

1. `.env` - Base configurations shared across all environments
2. `.env.[environment]` - Environment-specific configurations (`.env.development`, `.env.production`)
3. `.env.local` - Local overrides for specific configurations (not versioned in git)

## Environment Variable Priority

Variables are loaded with the following priority (from highest to lowest):

1. Variables defined at OS or container level
2. `.env.local` (local overrides)
3. `.env.[environment]` (environment-specific)
4. `.env` (base)

## Usage in Code

To use environment variables in code, it is recommended to:

1. Use the centralized `utils/envConfig.js` module which provides a consistent API
2. Alternatively, access directly via `import.meta.env.VITE_XXX`

Example with the centralized module:
```js
import config from '../utils/envConfig';

// Accessing a variable
const apiUrl = config.app.apiUrl;

// Using a helper function
const streamUrl = config.streaming.formatWebrtcUrl(streamName);
```

## Environment Variable Validation

The system implements validation through Zod (in `utils/envValidation.js`) which verifies:

1. The presence of required variables
2. Correct types for each variable
3. Valid values for specific enumerations (e.g., log levels)

You can run a manual verification with the command:
```bash
npm run check-env
```

## Debug Tools

### Environment Variable Debugger (Development Only)

A web interface to inspect all environment variables is available in development at:
```
http://localhost:8080/env-debug
```

This page shows:
- All VITE_* environment variables
- The processed configuration through the `envConfig.js` module
- Filtering functionality and sensitive value display options

### Utility Scripts

- `npm run check-env`: Verify the validity of environment configurations
- `npm run update-env-example`: Generate an updated `.env.example` file based on current variables

## Available Configuration Files

### `.env`

Contains base variables shared across all environments.

### `.env.development`

Configurations for the development environment:
- API and streaming URLs with local or staging endpoints
- Development credentials
- Debug enabled

### `.env.production`

Configurations for the production environment:
- API and streaming URLs with production endpoints
- Production credentials
- Debug disabled

### `.env.local`

Local overrides for individual developers:
- Not versioned in git
- Can contain personal credentials or machine-specific configurations

## Adding New Environment Variables

1. Add the variable to the `.env` file with a default value
2. Add specific values in the `.env.development` and `.env.production` files
3. Add the variable to the validation schema in `utils/envValidation.js`
4. Update the `utils/envConfig.js` module to expose the new variable through the API
5. Generate a new `.env.example` with `npm run update-env-example`
6. Update this README if necessary

## Security Considerations

- Never store sensitive credentials in versioned `.env` files
- Use `.env.local` for personal development credentials
- In production, prefer system environment variables or secret management solutions
