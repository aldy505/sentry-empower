# Sentry Empower Documentation

This directory contains comprehensive documentation for the Sentry Empower demo project, designed to help understand and implement the various backend APIs for load generation and Sentry monitoring demonstrations.

## Documentation Overview

### 📋 [Backend API Specification](./backend-api-specification.md)
Complete specification of all API endpoints that backends should implement. This serves as the authoritative reference for:
- Required endpoints and their functionality
- Request/response formats
- Sentry integration requirements
- Performance testing features
- Environment variables and configuration

### 📊 [Backend Implementation Status](./backend-implementation-status.md)  
Detailed analysis of current implementation status across all backend services:
- Implementation matrix showing which endpoints are complete
- Detailed analysis by backend (Flask, Express, Laravel, Ruby, ASP.NET Core, Spring Boot, Ruby on Rails)
- Priority recommendations for missing implementations
- Testing strategy for load generation

### 🔗 [Frontend-Backend Integration](./frontend-backend-integration.md)
Guide to how React and Vue frontends interact with backend APIs:
- Backend selection mechanisms
- API integration patterns
- Error generation strategies
- Performance testing features
- Load generation capabilities

## Quick Start

### For Load Generation
1. Review the [Backend Implementation Status](./backend-implementation-status.md) to understand which backends are ready for testing
2. Use Flask as the primary backend (most complete implementation)
3. Configure frontend apps to rotate between available backends
4. Follow the integration patterns in [Frontend-Backend Integration](./frontend-backend-integration.md)

### For Backend Development
1. Use [Backend API Specification](./backend-api-specification.md) as your implementation guide
2. Reference Flask implementation (`/flask` directory) as the complete example
3. Check [Backend Implementation Status](./backend-implementation-status.md) for your specific backend's missing features

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│                 │    │                  │    │                 │
│  React Frontend │◄──►│   Load Balancer  │◄──►│ Backend Services│
│                 │    │   (Nginx/etc)    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       ▼                       ▼
         │              ┌─────────────────┐    ┌─────────────────┐
         │              │                 │    │                 │
         └──────────────►│ Sentry Instance │◄───│   Databases     │
                         │  (Self-hosted)  │    │ (PostgreSQL)    │
                         └─────────────────┘    └─────────────────┘
```

## Backend Services Status

| Service | Status | Completeness | Ready for Load Testing |
|---------|--------|--------------|----------------------|
| Flask | ✅ Complete | 16/16 endpoints | ✅ Yes |
| Spring Boot | 🟡 Good | 10/16 endpoints | ✅ Yes |
| Ruby on Rails | 🟡 Good | 9/16 endpoints | ✅ Yes |
| Laravel | 🟡 Partial | 9/16 endpoints | 🟡 Limited |
| Express | 🟡 Partial | 8/16 endpoints | 🟡 Limited |
| Ruby (Sinatra) | ❌ Minimal | 5/16 endpoints | ❌ No |
| ASP.NET Core | ❌ Minimal | 2/16 endpoints | ❌ No |

## Key Features for Sentry Demo

### Error Generation
- **Handled Exceptions**: `/handled` endpoint
- **Unhandled Exceptions**: `/unhandled` endpoint  
- **Network Errors**: Frontend fetch failures
- **Performance Issues**: N+1 queries, slow responses

### Performance Monitoring
- **Database Performance**: Products with joins
- **Asset Loading**: Compressed vs uncompressed assets
- **API Response Times**: Configurable delays
- **Caching Demonstration**: Redis integration

### Transaction Tracing
- **Distributed Tracing**: Cross-service API calls
- **Database Spans**: Query performance tracking
- **Custom Spans**: Business logic instrumentation
- **Error Context**: Full request context preservation

### User Context
- **Custom Headers**: SE identifier, customer type, email
- **User Identification**: Email-based user tracking
- **Custom Tags**: Environment and configuration tags
- **Release Tracking**: Version-specific error grouping

## Environment Setup

### Required Environment Variables
```bash
# Sentry Configuration
DSN=your-sentry-dsn-here
RELEASE=your-release-version
ENVIRONMENT=production|development

# Backend URLs
FLASK_BACKEND=http://localhost:5000
EXPRESS_BACKEND=http://localhost:3001
# ... etc for each backend

# Feature Flags
RUN_SLOW_PROFILE=true
OPENAI_API_KEY=your-openai-key (optional)
```

### Database Setup
Most backends require PostgreSQL with the Empower schema:
- Products table
- Inventory table  
- Reviews table
- See `/postgres/data/empowerplant.sql` for schema

### Redis Setup
Required for caching demonstrations:
- Default: `localhost:6379`
- Configure via `REDISHOST` and `REDISPORT` environment variables

## Load Testing Recommendations

### Primary Testing Flow
1. **Product Browsing**: `GET /products` with various parameters
2. **Detailed Views**: `GET /product/0/info` for N+1 queries
3. **Cart Operations**: Build cart via frontend state
4. **Checkout Process**: `POST /checkout` with inventory validation
5. **Background APIs**: Parallel `/api`, `/connect`, `/organization` calls

### Error Scenario Testing
1. **Handled Errors**: `GET /handled` endpoints
2. **Unhandled Errors**: `GET /unhandled` endpoints
3. **Network Failures**: Invalid backend URLs
4. **Timeout Scenarios**: Slow backend responses
5. **Invalid Data**: Malformed checkout requests

### Performance Testing
1. **Slow Processing**: `?fetch_promotions=true` parameter
2. **Asset Loading**: `?frontendSlowdown=true` for large assets
3. **Database Load**: Products-join endpoints
4. **Cache Testing**: Organization endpoint with cache misses/hits

## Contributing

When adding new backends or modifying existing ones:

1. Follow the [Backend API Specification](./backend-api-specification.md)
2. Update the [Backend Implementation Status](./backend-implementation-status.md)
3. Test integration with both React and Vue frontends
4. Ensure proper Sentry integration for all endpoints
5. Implement error scenarios for comprehensive testing

For questions or issues, refer to the main project README or create an issue in the repository.