# Frontend-Backend Integration Guide

This document outlines how the React and Vue frontends interact with the backend APIs, providing insights for load generation and understanding the data flow in the Sentry Empower demo application.

## Frontend Architecture Overview

The project includes two frontend implementations:
- **React** (`/react` directory) - Primary frontend implementation
- **Vue** (`/vue` directory) - Alternative frontend implementation

Both frontends are designed to work with any backend implementation through a configurable backend router system.

## Backend Selection Mechanism

### Supported Backend Types
```javascript
const SUPPORTED_BACKEND_TYPES = {
  flask: process.env.REACT_APP_FLASK_BACKEND,
  express: process.env.REACT_APP_EXPRESS_BACKEND,
  springboot: process.env.REACT_APP_SPRINGBOOT_BACKEND,
  aspnetcore: process.env.REACT_APP_ASPNETCORE_BACKEND,
  laravel: process.env.REACT_APP_LARAVEL_BACKEND,
  ruby: process.env.REACT_APP_RUBY_BACKEND,
  rails: process.env.REACT_APP_RUBYONRAILS_BACKEND,
};
```

### Default Configuration
- **Default Backend**: Flask
- **Fallback URL**: `http://localhost:5000`
- **Backend Selection**: Via environment variables or URL parameters

## API Integration Patterns

### 1. Product Catalog Loading

#### React Implementation (`/react/src/components/Products.jsx`)
```javascript
// Products endpoint with performance testing parameters
const productsEndpoint = getProductsEndpoint();
const response = await fetch(backend + productsEndpoint, {
  method: "GET",
  headers: headers,
});
```

**Performance Testing Features**:
- `?fetch_promotions=true` - Triggers slower response times
- Dynamic endpoint selection based on URL parameters
- Parallel background API calls to `/api`, `/connect`, `/organization`

#### Vue Implementation (`/vue/src/views/ProductsView.vue`)
```javascript
// Hardcoded to Flask backend for demos
fetch("https://application-monitoring-flask-dot-sales-engineering-sf.appspot.com/products")
```

### 2. Checkout Process

#### React Implementation (`/react/src/components/Checkout.jsx`)
```javascript
const response = await fetch(backend + "/checkout?v2=true", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...headers,
  },
  body: JSON.stringify({
    cart: cart,
    form: form,
    validate_inventory: "true",
  }),
});
```

#### Vue Implementation (`/vue/src/views/CheckoutView.vue`)
```javascript
// Also hardcoded to Flask
fetch("https://application-monitoring-flask-dot-sales-engineering-sf.appspot.com/checkout", {
  method: "POST",
  body: JSON.stringify(checkoutData)
})
```

### 3. Background API Calls

#### Parallel Endpoint Testing
```javascript
["/api", "/connect", "/organization"].forEach((endpoint) => {
  fetch(backend + endpoint, {
    method: "GET", 
    headers: headers,
  });
});
```

This pattern is used in React to:
- Test multiple endpoints simultaneously
- Generate load across different backend services
- Demonstrate distributed tracing capabilities

### 4. N+1 Query Demonstration

#### React Implementation (`/react/src/components/nplusone.jsx`)
```javascript
for (let i = 1; i < 5; i++) {
  fetch(backend + "/product/0/info?id=" + i, {
    method: "GET",
    headers: headers,
  });
}
```

### 5. Email Subscription

#### React Implementation (`/react/src/components/Footer.jsx`)
```javascript
const resp = await fetch(`${backend}/enqueue`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: email }),
});
```

## Header Propagation

### Standard Headers
Both frontends propagate these headers for Sentry context:

- `se` - Sales Engineering identifier
- `customerType` - Customer classification  
- `email` - User email for Sentry user context

### Header Implementation
```javascript
const headers = {
  se: getSEHeader(),
  customerType: getCustomerType(), 
  email: getEmail(),
};
```

## Error Generation Patterns

### Frontend Error Scenarios

1. **Fetch Failures**: Network connectivity issues
2. **Invalid Responses**: Non-200 HTTP status codes
3. **JSON Parsing Errors**: Malformed backend responses
4. **Timeout Issues**: Slow backend responses

### Error Handling Strategy
```javascript
try {
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
} catch (error) {
  // Captured automatically by Sentry
  console.error("API Error:", error);
}
```

## Performance Testing Features

### 1. Asset Loading Simulation
```javascript
// React implementation
function fetchUncompressedAsset() {
  // Dynamically creates script tags to load large assets
  // Simulates slow network conditions
}
```

### 2. Frontend Slowdown
- Query parameter `frontendSlowdown=true`
- Loads uncompressed assets instead of compressed
- Simulates poor network conditions

### 3. API Query Parameters
- `api=join` - Forces use of products-join endpoint
- `fetch_promotions=true` - Enables slower backend processing
- Various `cexp` parameters for controlled experiment simulation

## Load Generation Capabilities

### High-Volume Endpoints
1. `GET /products` - Primary product catalog
2. `GET /api` - Health check/connectivity
3. `GET /organization` - Cached organizational data
4. `GET /connect` - Connection testing

### Transaction Simulation
1. `POST /checkout` - E-commerce transaction processing
2. `POST /enqueue` - Async job queue testing
3. `GET /product/0/info` - Individual product queries (N+1)

### Background Load
- Parallel API calls during page loads
- Automatic retry mechanisms
- Performance timing collection

## Configuration for Load Testing

### Environment Variables
```bash
# Backend Selection
REACT_APP_FLASK_BACKEND=http://localhost:5000
REACT_APP_EXPRESS_BACKEND=http://localhost:3001
REACT_APP_SPRINGBOOT_BACKEND=http://localhost:8080
# ... etc

# Sentry Configuration
REACT_APP_SENTRY_DSN=your-sentry-dsn
REACT_APP_SENTRY_RELEASE=your-release
```

### URL Parameters for Testing
```
?backend=flask          # Select specific backend
?se=load-test-123      # Sales engineering identifier
?api=join              # Use products-join endpoint
?fetch_promotions=true # Enable slow processing
?frontendSlowdown=true # Load uncompressed assets
```

## Monitoring Integration

### Automatic Instrumentation
- All fetch requests are automatically instrumented
- Request headers include Sentry trace information
- Performance metrics collected for Web Vitals

### Custom Spans
```javascript
// React measurement utilities
import { measureRequestDuration } from './utils/measureRequestDuration';

// Automatic performance tracking for all API calls
```

### Error Context
- All API errors include request context
- Headers preserved in error reports
- Backend selection information in error tags

## Best Practices for Load Generation

### 1. Backend Rotation
- Use different backend types in rotation
- Test failover scenarios
- Validate consistent behavior across implementations

### 2. Realistic User Flows
- Product browsing → Cart addition → Checkout
- Background API calls during normal navigation
- Error scenario testing (invalid data, network failures)

### 3. Performance Scenarios
- Enable `frontendSlowdown` for network simulation
- Use `fetch_promotions` for backend stress testing
- Implement N+1 query patterns for database load

### 4. Monitoring Coverage  
- Ensure all backends have proper Sentry integration
- Validate error reporting across all endpoints
- Monitor performance metrics for comparison

## Vue.js Specific Notes

### Hardcoded Backend URLs
The Vue implementation currently uses hardcoded Flask URLs:
```
https://application-monitoring-flask-dot-sales-engineering-sf.appspot.com
```

### Limitations
- Less flexible than React for backend testing
- No automatic backend selection
- Fewer performance testing features

### Recommendation
For comprehensive load testing, prioritize the React frontend due to its:
- Dynamic backend selection
- More comprehensive error scenarios
- Better performance testing capabilities
- More realistic user interaction patterns