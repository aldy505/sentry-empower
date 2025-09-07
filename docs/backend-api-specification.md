# Backend API Specification

This document outlines the complete API specification that all backend implementations should support for the Sentry Empower demo project. This serves as a load generator for feeding events, errors, and spans data into test instances of self-hosted Sentry.

## Overview

The Sentry Empower project simulates an e-commerce plant store application. All backend implementations should provide consistent API endpoints to support both React and Vue frontend applications, ensuring proper error generation and monitoring capabilities for Sentry demo purposes.

## Required API Endpoints

### Core E-commerce Endpoints

#### `GET /products`
- **Purpose**: Retrieve list of products with optional performance testing parameters
- **Query Parameters**:
  - `fetch_promotions` (boolean): Triggers slower response for performance testing
  - `in_stock_only` (boolean): Filter products by inventory status
- **Response**: JSON array of product objects
- **Performance**: Implements artificial delays for demo purposes
- **Sentry Integration**: Includes performance spans and error handling

#### `GET /products-join`
- **Purpose**: Retrieve products using database joins (N+1 query simulation)
- **Response**: JSON array of products with related data
- **Sentry Integration**: Demonstrates database performance issues

#### `POST /checkout`
- **Purpose**: Process order checkout with inventory validation
- **Request Body**:
  ```json
  {
    "cart": {
      "items": [/* product objects */],
      "quantities": {"productId": quantity}
    },
    "form": {/* customer form data */},
    "validate_inventory": "true|false"
  }
  ```
- **Response**: 
  - Success: `{"status": "success"}`
  - Partial: `{"status": "partial", "out_of_stock": [/* items */]}`
  - Failed: `{"status": "failed"}`
- **Sentry Integration**: Error handling for inventory issues

### Support Endpoints

#### `GET /api`
- **Purpose**: Basic API health check endpoint
- **Response**: String identifying the backend (e.g., "flask /api")
- **Usage**: Called by frontends for backend connectivity testing

#### `GET /organization`
- **Purpose**: Organization-related endpoint with caching demonstration
- **Response**: String identifying the backend (e.g., "flask /organization")
- **Features**: Implements caching with random database queries for demo

#### `GET /connect`
- **Purpose**: Connection testing endpoint
- **Response**: String identifying the backend (e.g., "flask /connect")
- **Usage**: Used in parallel with `/api` and `/organization` for load testing

#### `GET /success`
- **Purpose**: Success page endpoint
- **Response**: Success message string
- **Usage**: Navigation target after successful operations

### Demo-Specific Endpoints

#### `GET /handled`
- **Purpose**: Generates handled exceptions for Sentry demonstration
- **Response**: "failed" string
- **Sentry Integration**: Captures intentional exceptions

#### `GET /unhandled`
- **Purpose**: Generates unhandled exceptions for Sentry demonstration
- **Response**: Should throw an unhandled exception
- **Sentry Integration**: Demonstrates automatic error capture

#### `GET /product/0/info`
- **Purpose**: Product detail endpoint with N+1 query simulation
- **Query Parameters**: `id` (product ID)
- **Response**: Product information string
- **Performance**: Includes artificial delay (0.55s)

### Advanced Features Endpoints

#### `POST /enqueue`
- **Purpose**: Email subscription queue processing
- **Request Body**: `{"email": "user@example.com"}`
- **Response**: `{"status": "success"}`
- **Features**: Demonstrates async job processing

#### `GET /suggestion`
- **Purpose**: AI-powered plant suggestions (OpenAI integration)
- **Query Parameters**:
  - `catalog` (string): Product catalog data
  - `geo` (string): User location
- **Response**: `{"suggestion": "AI-generated suggestion"}`
- **Features**: Integrates with OpenAI API for plant recommendations

#### `GET /showSuggestion`
- **Purpose**: Check if AI suggestions are available
- **Response**: `{"response": boolean}` (true if OpenAI key is configured)

### Asset Delivery Endpoints

#### `GET /uncompressed_assets/<path>`
- **Purpose**: Serve large uncompressed assets for performance testing
- **Features**: 
  - Artificial 0.55s delay
  - Timing-Allow-Origin header for performance monitoring
  - Content-Type: application/octet-stream

#### `GET /compressed_assets/<path>`
- **Purpose**: Serve optimized compressed assets
- **Features**: Timing-Allow-Origin header for performance monitoring

## Request Headers

All endpoints should support these custom headers for Sentry context:

- `se` (string): Sales Engineering identifier for demo tracking
- `customerType` (string): Customer type classification
- `email` (string): User email for Sentry user context

## Response Requirements

### Error Handling
- All endpoints should implement proper error handling with Sentry integration
- Errors should be captured using Sentry SDK
- Return appropriate HTTP status codes

### Performance Monitoring
- Implement custom spans for database operations
- Include artificial delays where specified for demo purposes
- Support performance profiling features

### Logging
- Log all endpoint access for debugging
- Include structured logging where possible
- Integrate with Sentry logging features

## Database Operations

Backends should support these database operations:

### Products Table
- `get_products()`: Retrieve all products
- `get_products_join()`: Retrieve products with joins (demonstrates N+1 queries)

### Inventory Table
- `get_inventory(cart)`: Check inventory for cart items
- `decrement_inventory(id, quantity)`: Reduce inventory count

## Environment Variables

All backends should support these environment variables:

- `DSN`: Sentry DSN for the specific backend
- `RELEASE`: Release version for Sentry
- `ENVIRONMENT`: Environment name (development, production, etc.)
- `RUBY_BACKEND`: URL of Ruby backend for API calls
- `OPENAI_API_KEY`: OpenAI API key for suggestions feature
- `RUN_SLOW_PROFILE`: Boolean to enable/disable performance delays

## Caching Implementation

Backends should implement Redis caching for:
- Organization endpoint responses
- API request results
- Performance demonstration purposes

## Cross-Origin Resource Sharing (CORS)

All endpoints must support CORS with:
- Origin: `*` (for demo purposes)
- Methods: `GET, POST, OPTIONS`
- Headers: Support all custom headers plus standard headers

## Health Check Integration

Each backend should provide a root endpoint (`/`) that returns a descriptive message identifying the service and its purpose within the microservices architecture.