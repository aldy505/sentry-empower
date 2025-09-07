# Go Backend Implementation Guide for Sentry Empower

This document provides comprehensive guidance for implementing a Go backend for the Sentry Empower demo project, leveraging the highly-rated Sentry Go SDK and its extensive integration ecosystem.

## Overview

The Go backend will serve as a high-performance alternative to the existing backends, showcasing the Sentry Go SDK's capabilities. Go's popularity in microservices and cloud-native applications makes it an excellent addition to the demo project for enterprise audiences.

---

## 🚀 Why Add a Go Backend?

### Benefits
- **Performance**: Go's excellent concurrency and low memory footprint
- **Popular SDK**: One of Sentry's most starred SDKs on GitHub
- **Cloud-Native**: Perfect for containerized deployments
- **Enterprise Appeal**: Go is widely adopted in backend services
- **Rich Integrations**: Extensive framework and library support

### Use Cases for Demo
- Microservices architecture demonstration
- High-throughput API load testing
- Container orchestration with Sentry monitoring
- Performance comparison with other backends

---

## 🛠 Sentry Go SDK Features & Integrations

### Core SDK Capabilities (2025)
- **Version Support**: Go 1.21, 1.22, 1.23 (latest 3 stable releases)
- **Modular Architecture**: Separate modules for each integration (reduced binary size)
- **Performance Tracing**: Built-in distributed tracing support
- **Error Monitoring**: Panic recovery and error context capture
- **Profiling**: Continuous profiling support

### Available Integrations

#### Web Frameworks
- **Gin**: `github.com/getsentry/sentry-go/gin` 
- **Echo**: `github.com/getsentry/sentry-go/echo`
- **Fiber**: `github.com/getsentry/sentry-go/fiber`
- **FastHTTP**: Built-in support
- **net/http**: Standard library integration
- **Iris**: Built-in support
- **Negroni**: Built-in support

#### Database & Storage
- **GORM**: Custom instrumentation recommended
- **PostgreSQL**: Via `database/sql` instrumentation
- **Redis**: Custom instrumentation with `github.com/go-redis/redis`
- **MongoDB**: Custom instrumentation possible

#### Logging
- **Logrus**: Available integration
- **Zerolog**: Available integration  
- **Slog**: Standard library integration (Go 1.21+)

### Default Integrations (Auto-enabled)
1. **ModulesIntegration**: Records all Go modules and versions
2. **EnvironmentIntegration**: Captures runtime and OS information
3. **IgnoreErrorsIntegration**: Pattern-based error filtering
4. **IgnoreTransactionsIntegration**: Transaction filtering
5. **ContextifyFramesIntegration**: Source code context capture
6. **GlobalTagsIntegration**: Global tagging support

---

## 📋 Required Endpoint Implementation

Based on the [Backend API Specification](./backend-api-specification.md), implement these endpoints:

### Core E-commerce Endpoints (Priority 1)
- `GET /products` - Product catalog with performance testing
- `GET /products-join` - Products with database joins (N+1 demo)
- `POST /checkout` - Order processing with inventory validation
- `GET /success` - Success page endpoint

### Support Endpoints (Priority 1)
- `GET /` - Health check / root endpoint
- `GET /api` - API health check
- `GET /organization` - Organizational data with caching
- `GET /connect` - Connection testing

### Error Demonstration (Priority 2)
- `GET /handled` - Handled exception scenarios
- `GET /unhandled` - Unhandled panic scenarios
- `GET /product/0/info` - N+1 query demonstration

### Advanced Features (Priority 3)
- `POST /enqueue` - Queue processing demonstration
- `GET /suggestion` - AI integration (optional)
- `GET /showSuggestion` - AI availability check
- `GET /uncompressed_assets/<path>` - Asset serving
- `GET /compressed_assets/<path>` - Optimized assets

---

## 🏗 Implementation Structure

### Project Structure
```
go/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── handlers/
│   │   ├── products.go
│   │   ├── checkout.go
│   │   ├── errors.go
│   │   └── health.go
│   ├── middleware/
│   │   ├── sentry.go
│   │   ├── cors.go
│   │   └── logging.go
│   ├── database/
│   │   ├── connection.go
│   │   ├── products.go
│   │   └── inventory.go
│   ├── services/
│   │   ├── product_service.go
│   │   └── inventory_service.go
│   └── models/
│       ├── product.go
│       ├── inventory.go
│       └── order.go
├── config/
│   └── config.go
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── scripts/
│   ├── build.sh
│   └── run.sh
├── go.mod
├── go.sum
└── README.md
```

---

## 💻 Core Implementation

### 1. Main Application Setup

```go
// cmd/server/main.go
package main

import (
    "context"
    "log"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/getsentry/sentry-go"
    sentrygin "github.com/getsentry/sentry-go/gin"
    
    "your-module/internal/handlers"
    "your-module/internal/middleware"
    "your-module/config"
)

func main() {
    // Load configuration
    cfg := config.Load()

    // Initialize Sentry
    err := sentry.Init(sentry.ClientOptions{
        Dsn:                cfg.SentryDSN,
        Release:            cfg.Release,
        Environment:        cfg.Environment,
        Debug:              cfg.Debug,
        SendDefaultPII:     true,
        EnableTracing:      true,
        TracesSampleRate:   1.0,
        ProfilesSampleRate: 1.0,
        AttachStacktrace:   true,
    })
    if err != nil {
        log.Fatalf("sentry.Init: %s", err)
    }

    // Flush events before program terminates
    defer sentry.Flush(2 * time.Second)

    // Setup Gin router
    if !cfg.Debug {
        gin.SetMode(gin.ReleaseMode)
    }

    r := gin.New()
    
    // Middleware
    r.Use(gin.Recovery())
    r.Use(middleware.Logger())
    r.Use(middleware.CORS())
    
    // Sentry middleware with configuration
    r.Use(sentrygin.New(sentrygin.Options{
        Repanic:         true,
        WaitForDelivery: false,
        Timeout:         5 * time.Second,
    }))

    // Custom Sentry context middleware
    r.Use(middleware.SentryContext())

    // Routes
    setupRoutes(r, cfg)

    // Server setup with graceful shutdown
    srv := &http.Server{
        Addr:    ":" + cfg.Port,
        Handler: r,
    }

    go func() {
        log.Printf("Server starting on port %s", cfg.Port)
        if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Server failed to start: %v", err)
        }
    }()

    // Graceful shutdown
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    log.Println("Server shutting down...")
    
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    
    if err := srv.Shutdown(ctx); err != nil {
        log.Fatal("Server forced to shutdown:", err)
    }
}

func setupRoutes(r *gin.Engine, cfg *config.Config) {
    // Health endpoints
    r.GET("/", handlers.HealthCheck)
    r.GET("/api", handlers.APIHealthCheck)
    r.GET("/organization", handlers.Organization)
    r.GET("/connect", handlers.Connect)
    r.GET("/success", handlers.Success)

    // Product endpoints
    r.GET("/products", handlers.GetProducts)
    r.GET("/products-join", handlers.GetProductsJoin)
    
    // E-commerce endpoints
    r.POST("/checkout", handlers.Checkout)
    
    // Error demonstration endpoints
    r.GET("/handled", handlers.HandledError)
    r.GET("/unhandled", handlers.UnhandledError)
    r.GET("/product/0/info", handlers.ProductInfo)
    
    // Advanced endpoints
    r.POST("/enqueue", handlers.EnqueueEmail)
    r.GET("/suggestion", handlers.AISuggestion)
    r.GET("/showSuggestion", handlers.ShowSuggestion)
    
    // Asset endpoints
    r.GET("/uncompressed_assets/*filepath", handlers.UncompressedAssets)
    r.GET("/compressed_assets/*filepath", handlers.CompressedAssets)
}
```

### 2. Configuration Management

```go
// config/config.go
package config

import (
    "os"
    "strconv"
)

type Config struct {
    Port        string
    SentryDSN   string
    Release     string
    Environment string
    Debug       bool
    
    // Database
    DatabaseURL string
    RedisURL    string
    
    // External services
    RubyBackend string
    OpenAIKey   string
    
    // Performance testing
    RunSlowProfile bool
}

func Load() *Config {
    debug, _ := strconv.ParseBool(os.Getenv("DEBUG"))
    runSlow, _ := strconv.ParseBool(getEnvOrDefault("RUN_SLOW_PROFILE", "true"))
    
    return &Config{
        Port:           getEnvOrDefault("PORT", "8080"),
        SentryDSN:      os.Getenv("GO_DSN"),
        Release:        os.Getenv("RELEASE"),
        Environment:    getEnvOrDefault("GO_ENV", "development"),
        Debug:          debug,
        DatabaseURL:    os.Getenv("DATABASE_URL"),
        RedisURL:       getEnvOrDefault("REDIS_URL", "redis://localhost:6379"),
        RubyBackend:    os.Getenv("RUBY_BACKEND"),
        OpenAIKey:      os.Getenv("OPENAI_API_KEY"),
        RunSlowProfile: runSlow,
    }
}

func getEnvOrDefault(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}
```

### 3. Custom Sentry Middleware

```go
// internal/middleware/sentry.go
package middleware

import (
    "github.com/gin-gonic/gin"
    "github.com/getsentry/sentry-go"
    sentrygin "github.com/getsentry/sentry-go/gin"
)

// SentryContext adds custom Sentry context from headers
func SentryContext() gin.HandlerFunc {
    return func(c *gin.Context) {
        if hub := sentrygin.GetHubFromContext(c); hub != nil {
            hub.ConfigureScope(func(scope *sentry.Scope) {
                // Extract custom headers for Sentry context
                if se := c.GetHeader("se"); se != "" && se != "undefined" {
                    scope.SetTag("se", se)
                }
                
                if customerType := c.GetHeader("customerType"); customerType != "" && customerType != "undefined" {
                    scope.SetTag("customerType", customerType)
                }
                
                if email := c.GetHeader("email"); email != "" && email != "undefined" {
                    scope.SetUser(sentry.User{Email: email})
                }
                
                // Add request context
                scope.SetContext("request", map[string]interface{}{
                    "url":    c.Request.URL.String(),
                    "method": c.Request.Method,
                    "query":  c.Request.URL.Query(),
                })
            })
        }
        
        c.Next()
    }
}
```

### 4. Product Handlers with Tracing

```go
// internal/handlers/products.go
package handlers

import (
    "encoding/json"
    "math/rand"
    "net/http"
    "strconv"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/getsentry/sentry-go"
    sentrygin "github.com/getsentry/sentry-go/gin"
    
    "your-module/internal/services"
)

func GetProducts(c *gin.Context) {
    hub := sentrygin.GetHubFromContext(c)
    
    // Start transaction
    transaction := sentry.StartTransaction(
        c.Request.Context(),
        "GET /products",
        sentry.WithTransactionSource(sentry.SourceRoute),
    )
    defer transaction.Finish()
    
    // Add transaction to context for nested spans
    ctx := transaction.Context()
    
    // Extract query parameters for performance testing
    fetchPromotions := c.Query("fetch_promotions") == "true"
    inStockOnly := c.Query("in_stock_only") == "true"
    
    // Add tags for monitoring
    hub.AddBreadcrumb(&sentry.Breadcrumb{
        Type:     "info",
        Category: "api.request",
        Message:  "Products requested",
        Data: map[string]interface{}{
            "fetch_promotions": fetchPromotions,
            "in_stock_only":    inStockOnly,
        },
        Level: sentry.LevelInfo,
    }, nil)

    // Simulate performance delays for demo
    timeoutSeconds := 2.0 // Normal delay
    if fetchPromotions {
        timeoutSeconds = 24.0 // Extremely slow for demo
    }
    
    // Cache simulation
    cacheKey := strconv.Itoa(rand.Intn(100))
    rubyDelayTime := 0.0
    if cacheKey != "7" {
        timeoutSeconds -= 0.5
        rubyDelayTime = 0.5
    }

    // Database query span
    span := transaction.StartChild("db.query")
    span.Description = "Get products from database"
    
    products, err := services.GetProducts(ctx, inStockOnly)
    if err != nil {
        span.SetStatus(sentry.SpanStatusInternalError)
        hub.CaptureException(err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products"})
        return
    }
    span.Finish()

    // Simulate CPU-intensive processing for profiling
    if timeoutSeconds > 2 {
        processingSpan := transaction.StartChild("cpu.processing")
        processingSpan.Description = "Process product descriptions"
        
        simulateHeavyProcessing(ctx, products, timeoutSeconds)
        processingSpan.Finish()
    }

    // External API call simulation
    go makeRubyAPICall(c.Request.Context(), cacheKey, rubyDelayTime)

    // Set response data
    transaction.SetData("product_count", len(products))
    transaction.SetData("cache_key", cacheKey)
    transaction.SetTag("performance_tier", 
        map[bool]string{true: "slow", false: "normal"}[fetchPromotions])

    c.Header("Cache-Control", "public, max-age=300")
    c.JSON(http.StatusOK, products)
}

func GetProductsJoin(c *gin.Context) {
    hub := sentrygin.GetHubFromContext(c)
    
    transaction := sentry.StartTransaction(
        c.Request.Context(),
        "GET /products-join",
        sentry.WithTransactionSource(sentry.SourceRoute),
    )
    defer transaction.Finish()

    // Database join span - demonstrates N+1 queries
    span := transaction.StartChild("db.query")
    span.Description = "Get products with joins (N+1 demonstration)"
    
    products, err := services.GetProductsWithJoins(transaction.Context())
    if err != nil {
        span.SetStatus(sentry.SpanStatusInternalError)
        hub.CaptureException(err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch products with joins"})
        return
    }
    span.Finish()

    // External API call
    go makeRubyAPICall(c.Request.Context(), "join", 0)

    transaction.SetData("product_count", len(products))
    transaction.SetTag("query_type", "join")

    c.JSON(http.StatusOK, products)
}

func simulateHeavyProcessing(ctx context.Context, products []interface{}, duration float64) {
    span := sentry.StartSpanFromContext(ctx, "processing.heavy_computation")
    defer span.Finish()
    
    start := time.Now()
    
    // Simulate CPU-intensive work
    for {
        if time.Since(start).Seconds() > duration {
            break
        }
        
        // Simulate processing each product
        for range products {
            // Some CPU work
            _ = rand.Intn(1000)
        }
        
        time.Sleep(10 * time.Millisecond)
    }
    
    span.SetData("processing_duration", time.Since(start).Seconds())
}

func makeRubyAPICall(ctx context.Context, key string, delay float64) {
    span := sentry.StartSpanFromContext(ctx, "http.client")
    span.Description = "Call Ruby backend API"
    defer span.Finish()
    
    // Simulate the external API call delay
    if delay > 0 {
        time.Sleep(time.Duration(delay * float64(time.Second)))
    }
    
    // Simulate cache behavior
    if key == "7" {
        span.SetTag("cache_status", "hit")
    } else {
        span.SetTag("cache_status", "miss")
    }
    
    span.SetData("cache_key", key)
}
```

### 5. Error Demonstration Handlers

```go
// internal/handlers/errors.go
package handlers

import (
    "errors"
    "net/http"
    "runtime"

    "github.com/gin-gonic/gin"
    "github.com/getsentry/sentry-go"
    sentrygin "github.com/getsentry/sentry-go/gin"
)

func HandledError(c *gin.Context) {
    hub := sentrygin.GetHubFromContext(c)
    
    // Create a handled error scenario
    err := errors.New("This is a handled error for demonstration")
    
    hub.WithScope(func(scope *sentry.Scope) {
        scope.SetTag("error_type", "handled_demo")
        scope.SetLevel(sentry.LevelError)
        scope.SetContext("handler_info", map[string]interface{}{
            "function": "HandledError",
            "file":     "errors.go",
            "purpose":  "Demonstrate handled error reporting",
        })
        
        hub.CaptureException(err)
    })
    
    c.JSON(http.StatusInternalServerError, gin.H{
        "status":  "error",
        "message": "A handled error occurred",
        "error":   err.Error(),
    })
}

func UnhandledError(c *gin.Context) {
    hub := sentrygin.GetHubFromContext(c)
    
    hub.AddBreadcrumb(&sentry.Breadcrumb{
        Type:     "error",
        Category: "demo",
        Message:  "About to trigger unhandled panic",
        Level:    sentry.LevelWarning,
    }, nil)
    
    // This will trigger a panic that gets caught by Gin's recovery middleware
    // and reported to Sentry
    panic("This is an unhandled panic for demonstration purposes")
}

func ProductInfo(c *gin.Context) {
    hub := sentrygin.GetHubFromContext(c)
    
    transaction := sentry.StartTransaction(
        c.Request.Context(),
        "GET /product/0/info",
        sentry.WithTransactionSource(sentry.SourceRoute),
    )
    defer transaction.Finish()
    
    // Simulate N+1 query problem
    productID := c.Query("id")
    if productID == "" {
        productID = "1"
    }
    
    // Add breadcrumb for N+1 demonstration
    hub.AddBreadcrumb(&sentry.Breadcrumb{
        Type:     "query",
        Category: "database",
        Message:  "N+1 query demonstration",
        Data: map[string]interface{}{
            "product_id": productID,
            "pattern":    "n_plus_one",
        },
        Level: sentry.LevelInfo,
    }, nil)
    
    // Simulate multiple individual queries (N+1 pattern)
    for i := 0; i < 5; i++ {
        span := transaction.StartChild("db.query")
        span.Description = "Individual product query #" + string(rune(i+'1'))
        
        // Simulate individual query delay
        time.Sleep(550 * time.Millisecond)
        
        span.SetData("query_number", i+1)
        span.SetData("product_id", productID)
        span.Finish()
    }
    
    transaction.SetTag("performance_issue", "n_plus_one")
    transaction.SetData("query_count", 5)
    
    c.JSON(http.StatusOK, gin.H{
        "product_id": productID,
        "info":      "go /product/0/info",
        "queries":   5,
    })
}
```

### 6. Checkout Handler with Business Logic

```go
// internal/handlers/checkout.go
package handlers

import (
    "encoding/json"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/getsentry/sentry-go"
    sentrygin "github.com/getsentry/sentry-go/gin"
    
    "your-module/internal/models"
    "your-module/internal/services"
)

func Checkout(c *gin.Context) {
    hub := sentrygin.GetHubFromContext(c)
    
    transaction := sentry.StartTransaction(
        c.Request.Context(),
        "POST /checkout",
        sentry.WithTransactionSource(sentry.SourceRoute),
    )
    defer transaction.Finish()

    // Parse request body
    var order models.Order
    if err := c.ShouldBindJSON(&order); err != nil {
        hub.CaptureException(err)
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
        return
    }

    // Add business context to Sentry
    hub.WithScope(func(scope *sentry.Scope) {
        scope.SetTag("order_type", "e_commerce")
        scope.SetContext("order", map[string]interface{}{
            "item_count":  len(order.Cart.Items),
            "total_value": order.Cart.Total,
            "currency":    "USD",
        })
    })

    // Validate inventory span
    inventorySpan := transaction.StartChild("business.inventory_check")
    inventorySpan.Description = "Check product inventory availability"
    
    inventory, err := services.GetInventory(transaction.Context(), order.Cart)
    if err != nil {
        inventorySpan.SetStatus(sentry.SpanStatusInternalError)
        hub.CaptureException(err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check inventory"})
        return
    }
    inventorySpan.Finish()

    // Process order span
    processingSpan := transaction.StartChild("business.order_processing")
    processingSpan.Description = "Process customer order"
    
    result, err := services.ProcessOrder(transaction.Context(), &order, inventory)
    if err != nil {
        processingSpan.SetStatus(sentry.SpanStatusInternalError)
        
        // Capture business error with context
        hub.WithScope(func(scope *sentry.Scope) {
            scope.SetTag("business_error", "order_processing")
            scope.SetContext("order_failure", map[string]interface{}{
                "order_value":    order.Cart.Total,
                "items_count":    len(order.Cart.Items),
                "failure_reason": err.Error(),
            })
            hub.CaptureException(err)
        })
        
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Order processing failed"})
        return
    }
    processingSpan.Finish()

    // Set success metrics
    transaction.SetTag("checkout_status", result.Status)
    transaction.SetData("items_processed", len(order.Cart.Items))
    transaction.SetData("order_value", order.Cart.Total)

    if result.Status == "partial" {
        hub.AddBreadcrumb(&sentry.Breadcrumb{
            Type:     "warning",
            Category: "business",
            Message:  "Partial order fulfillment",
            Data: map[string]interface{}{
                "out_of_stock_items": result.OutOfStock,
            },
            Level: sentry.LevelWarning,
        }, nil)
    }

    c.JSON(http.StatusOK, result)
}
```

---

## 📦 Dependencies (go.mod)

```go
module sentry-empower-go

go 1.21

require (
    github.com/gin-gonic/gin v1.10.0
    github.com/getsentry/sentry-go v0.35.0
    github.com/getsentry/sentry-go/gin v0.35.0
    github.com/lib/pq v1.10.9
    github.com/go-redis/redis/v8 v8.11.5
    github.com/joho/godotenv v1.5.1
    github.com/stretchr/testify v1.8.4
)

require (
    github.com/bytedance/sonic v1.11.6
    github.com/chenzhuoyu/base64x v0.0.0-20230717121745-296ad89f973d
    github.com/gabriel-vasile/mimetype v1.4.3
    github.com/gin-contrib/sse v0.1.0
    github.com/go-playground/locales v0.14.1
    github.com/go-playground/universal-translator v0.18.1
    github.com/go-playground/validator/v10 v10.20.0
    github.com/goccy/go-json v0.10.2
    github.com/json-iterator/go v1.1.12
    github.com/klauspost/cpuid/v2 v2.2.7
    github.com/leodido/go-urn v1.4.0
    github.com/mattn/go-isatty v0.0.20
    github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd
    github.com/modern-go/reflect2 v1.0.2
    github.com/pelletier/go-toml/v2 v2.2.2
    github.com/twitchyliquid64/golang-asm v0.15.1
    github.com/ugorji/go/codec v1.2.12
    golang.org/x/arch v0.8.0
    golang.org/x/crypto v0.23.0
    golang.org/x/net v0.25.0
    golang.org/x/sys v0.20.0
    golang.org/x/text v0.15.0
    google.golang.org/protobuf v1.34.1
    gopkg.in/yaml.v3 v3.0.1
)
```

---

## 🐳 Containerization

### Dockerfile
```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main cmd/server/main.go

# Production stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# Copy the binary
COPY --from=builder /app/main .

# Copy static assets
COPY --from=builder /app/assets ./assets

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# Run the application
CMD ["./main"]
```

### Docker Compose Integration
```yaml
# Add to main docker-compose.yml
go:
  build: 
    context: ./go
    dockerfile: Dockerfile
  environment:
    - GO_DSN=${GO_DSN}
    - RELEASE=${RELEASE}
    - GO_ENV=${ENVIRONMENT}
    - DATABASE_URL=${DATABASE_URL}
    - REDIS_URL=redis://redis:6379
    - RUBY_BACKEND=${RUBY_BACKEND}
    - OPENAI_API_KEY=${OPENAI_API_KEY}
  ports:
    - "8080:8080"
  depends_on:
    - postgres
    - redis
  volumes:
    - ./go/assets:/root/assets
  healthcheck:
    test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080/"]
    interval: 30s
    timeout: 10s
    retries: 3
```

---

## 🚀 Deployment Scripts

### Build Script
```bash
#!/bin/bash
# scripts/build.sh

set -e

echo "Building Sentry Empower Go Backend..."

# Clean previous builds
rm -f main

# Build for current platform
go build -o main cmd/server/main.go

echo "Build completed successfully!"

# Optional: Build for multiple platforms
echo "Building for multiple platforms..."

GOOS=linux GOARCH=amd64 go build -o main-linux-amd64 cmd/server/main.go
GOOS=darwin GOARCH=amd64 go build -o main-darwin-amd64 cmd/server/main.go
GOOS=windows GOARCH=amd64 go build -o main-windows-amd64.exe cmd/server/main.go

echo "Multi-platform builds completed!"
```

### Run Script
```bash
#!/bin/bash
# scripts/run.sh

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Set defaults
export PORT=${PORT:-8080}
export GO_ENV=${GO_ENV:-development}

echo "Starting Sentry Empower Go Backend on port $PORT..."

# Build if needed
if [ ! -f main ]; then
    echo "Binary not found, building..."
    ./scripts/build.sh
fi

# Run the application
./main
```

---

## 🧪 Testing Implementation

### Unit Tests Example
```go
// internal/handlers/products_test.go
package handlers

import (
    "net/http"
    "net/http/httptest"
    "testing"

    "github.com/gin-gonic/gin"
    "github.com/stretchr/testify/assert"
)

func TestGetProducts(t *testing.T) {
    gin.SetMode(gin.TestMode)
    
    w := httptest.NewRecorder()
    c, _ := gin.CreateTestContext(w)
    
    req, _ := http.NewRequest("GET", "/products", nil)
    c.Request = req
    
    GetProducts(c)
    
    assert.Equal(t, http.StatusOK, w.Code)
    assert.Contains(t, w.Body.String(), "products")
}

func TestProductsWithPromotions(t *testing.T) {
    gin.SetMode(gin.TestMode)
    
    w := httptest.NewRecorder()
    c, _ := gin.CreateTestContext(w)
    
    req, _ := http.NewRequest("GET", "/products?fetch_promotions=true", nil)
    c.Request = req
    
    GetProducts(c)
    
    assert.Equal(t, http.StatusOK, w.Code)
    // Should be slower due to promotions processing
}
```

---

## 📊 Performance Benchmarks

### Load Testing Support
```go
// Add performance testing endpoints
func BenchmarkEndpoint(c *gin.Context) {
    hub := sentrygin.GetHubFromContext(c)
    
    transaction := sentry.StartTransaction(
        c.Request.Context(),
        "GET /benchmark",
        sentry.WithTransactionSource(sentry.SourceRoute),
    )
    defer transaction.Finish()
    
    // CPU-intensive work for profiling
    span := transaction.StartChild("cpu.benchmark")
    span.Description = "CPU intensive benchmark"
    
    iterations := 1000000
    result := 0
    for i := 0; i < iterations; i++ {
        result += i * i
    }
    
    span.SetData("iterations", iterations)
    span.SetData("result", result)
    span.Finish()
    
    c.JSON(http.StatusOK, gin.H{
        "iterations": iterations,
        "result":     result,
    })
}
```

---

## 🎯 Advanced Sentry Features

### Custom Profiling
```go
// Enable custom profiling data
func ProfileHeavyOperation(c *gin.Context) {
    hub := sentrygin.GetHubFromContext(c)
    
    hub.WithScope(func(scope *sentry.Scope) {
        scope.SetTag("operation_type", "heavy_computation")
        scope.SetContext("profiling", map[string]interface{}{
            "expected_duration": "5s",
            "memory_intensive":  true,
            "cpu_intensive":     true,
        })
        
        // Heavy operation that will show in profiling
        heavyComputation()
    })
}

func heavyComputation() {
    // Simulate CPU and memory intensive work
    data := make([][]int, 1000)
    for i := range data {
        data[i] = make([]int, 1000)
        for j := range data[i] {
            data[i][j] = i * j
        }
    }
}
```

---

## 📋 Implementation Checklist

### Phase 1: Core Setup
- [ ] Project structure setup
- [ ] Sentry SDK integration with Gin
- [ ] Basic health check endpoints
- [ ] Database connection setup
- [ ] Docker configuration

### Phase 2: Core Endpoints  
- [ ] Products endpoints with performance testing
- [ ] Checkout endpoint with business logic
- [ ] Error demonstration endpoints
- [ ] External API integration (Ruby backend calls)

### Phase 3: Advanced Features
- [ ] Redis caching integration
- [ ] Queue processing endpoints
- [ ] AI integration (OpenAI)
- [ ] Asset serving endpoints
- [ ] Custom profiling implementations

### Phase 4: Production Readiness
- [ ] Comprehensive error handling
- [ ] Logging integration
- [ ] Performance optimization
- [ ] Load testing capabilities
- [ ] Documentation and deployment guides

This Go backend implementation will provide a high-performance, well-monitored service that showcases the full capabilities of the Sentry Go SDK while serving as an excellent addition to your demo environment.