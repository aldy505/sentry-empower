# Sentry Feature Flags & OpenFeature Integration Guide

This document provides comprehensive guidance on implementing feature flags with Sentry and OpenFeature integration for the Sentry Empower demo project, focusing on maintaining a small footprint while maximizing monitoring capabilities.

## Overview

Sentry's OpenFeature integration allows you to correlate feature flag evaluations with errors and performance data, providing crucial context for understanding how feature flags impact your application's behavior. This integration supports the OpenFeature standard, ensuring compatibility with multiple feature flag providers.

---

## 🏁 Feature Flag SDK Support

### ✅ Officially Supported SDKs (2025)

#### JavaScript/TypeScript Platforms
- **Browser/Web**: `@sentry/browser` (8.43.0+)
- **React**: `@sentry/react` (8.43.0+)
- **Next.js**: `@sentry/nextjs` (8.43.0+)
- **Remix**: `@sentry/remix` (8.43.0+)
- **Solid**: `@sentry/solid` (8.43.0+)
- **React Router**: `@sentry/browser` (8.43.0+)

#### Python
- **Python SDK**: `sentry-sdk[openfeature]` (2.19.2+)
- **Requirements**: Python 3.8+, OpenFeature SDK 0.7.1+

### ❌ Not Currently Supported
- **Go**: No official OpenFeature integration yet
- **Java/Spring Boot**: No official OpenFeature integration
- **Ruby**: No official OpenFeature integration  
- **PHP**: No official OpenFeature integration
- **C#/.NET**: No official OpenFeature integration

### 🚨 Current Limitations
- **Beta Status**: Integration is currently in beta
- **Boolean Only**: Only supports boolean flag evaluations
- **Browser Only** (JavaScript): Integration only works in browser environments
- **Memory Storage**: Flag evaluations held in memory, sent on error/transaction events

---

## 💡 Recommended Lightweight OpenFeature Providers

For maintaining a small footprint in the Sentry Empower demo, here are the recommended providers:

### 1. **Flagd** (Highly Recommended)
- **Type**: Open-source remote flag evaluation service
- **Footprint**: Minimal - single binary deployment
- **Benefits**: 
  - CNCF project with strong community support
  - Supports all OpenFeature SDK languages
  - Can run as sidecar or standalone service
  - Built-in evaluation caching
  - Zero external dependencies for basic usage

```yaml
# docker-compose.yml addition
flagd:
  image: ghcr.io/open-feature/flagd:latest
  ports:
    - "8013:8013"
  volumes:
    - ./flagd-config.json:/etc/flagd/config.json
```

### 2. **GO Feature Flag** (Best for Demo)
- **Type**: Lightweight, self-hosted, OpenFeature-native
- **Footprint**: Single Go binary (~15MB)
- **Benefits**:
  - 82% official OpenFeature coverage
  - Complete implementation across all SDK languages
  - Built-in web UI for flag management
  - File-based configuration (great for demos)
  - No external database required

```json
// go-feature-flag-config.json
{
  "test-flag": {
    "variations": {
      "A": true,
      "B": false
    },
    "defaultRule": {
      "variation": "A"
    }
  }
}
```

### 3. **Flipt** (Production-Ready Alternative)
- **Type**: Open-source, GitOps-focused
- **Footprint**: ~20MB Docker image
- **Benefits**:
  - 41% official OpenFeature coverage
  - Strong provider support across languages
  - GitOps integration
  - Web UI included
  - Early OFREP (OpenFeature Remote Evaluation Protocol) support

### 4. **File-Based Provider** (Minimal Demo)
- **Type**: Local JSON/YAML configuration
- **Footprint**: Zero external dependencies
- **Benefits**:
  - Perfect for demos and testing
  - No network dependencies
  - Version controlled with code
  - Instant flag updates via file changes

---

## 🔧 Implementation Guide

### JavaScript/React Implementation

#### 1. Installation
```bash
npm install @sentry/react @openfeature/web-sdk @openfeature/flagd-web-provider
```

#### 2. Basic Setup
```javascript
// feature-flags.js
import { OpenFeature } from '@openfeature/web-sdk';
import { FlagdWebProvider } from '@openfeature/flagd-web-provider';
import * as Sentry from '@sentry/react';

// Initialize Sentry with OpenFeature integration
Sentry.init({
  dsn: process.env.REACT_APP_DSN,
  integrations: [
    Sentry.openFeatureIntegration(),
    // ... other integrations
  ],
  enableTracing: true,
  tracesSampleRate: 1.0,
});

// Configure OpenFeature
OpenFeature.setProvider(new FlagdWebProvider({
  host: 'http://localhost',
  port: 8013,
  tls: false,
}));

// Add Sentry hook
OpenFeature.addHooks(new Sentry.OpenFeatureIntegrationHook());

export default OpenFeature;
```

#### 3. Usage in Components
```javascript
// Components/FeatureFlaggedComponent.jsx
import React, { useState, useEffect } from 'react';
import { OpenFeature } from '@openfeature/web-sdk';
import * as Sentry from '@sentry/react';

const FeatureFlaggedComponent = () => {
  const [showNewCheckout, setShowNewCheckout] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const client = OpenFeature.getClient();
    
    client.getBooleanValue('new-checkout-flow', false, {
      userId: 'demo-user',
      customerType: 'premium',
    }).then((value) => {
      setShowNewCheckout(value);
      setIsLoading(false);
      
      // Track flag evaluation in Sentry
      Sentry.addBreadcrumb({
        message: 'Feature flag evaluated',
        category: 'feature-flag',
        data: {
          flag: 'new-checkout-flow',
          value: value,
          context: { customerType: 'premium' }
        },
        level: 'info'
      });
    }).catch((error) => {
      setIsLoading(false);
      Sentry.captureException(error);
    });
  }, []);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {showNewCheckout ? (
        <NewCheckoutFlow />
      ) : (
        <LegacyCheckoutFlow />
      )}
    </div>
  );
};

export default Sentry.withErrorBoundary(FeatureFlaggedComponent);
```

### Python/Flask Implementation

#### 1. Installation
```bash
pip install "sentry-sdk[openfeature]" openfeature-sdk openfeature-provider-flagd
```

#### 2. Basic Setup
```python
# feature_flags.py
import sentry_sdk
from sentry_sdk.integrations.openfeature import OpenFeatureIntegration
from openfeature import api
from openfeature.provider.flagd import FlagdProvider

# Initialize Sentry with OpenFeature
sentry_sdk.init(
    dsn=os.environ["FLASK_APP_DSN"],
    integrations=[
        OpenFeatureIntegration(),
        # ... other integrations
    ],
    traces_sample_rate=1.0,
    enable_logs=True,
)

# Configure OpenFeature
api.set_provider(FlagdProvider(
    host="localhost",
    port=8013,
    tls=False,
))

client = api.get_client()
```

#### 3. Usage in Flask Routes
```python
# Enhanced checkout endpoint with feature flags
@app.route("/checkout-v2", methods=["POST"])
def checkout_v2():
    with sentry_sdk.start_transaction(op="checkout", name="checkout_with_flags"):
        # Evaluate feature flags
        use_fast_inventory = client.get_boolean_value(
            "fast-inventory-check", 
            default_value=False,
            evaluation_context={
                "user_id": request.headers.get("user-id"),
                "customer_type": request.headers.get("customerType"),
            }
        )
        
        use_async_processing = client.get_boolean_value(
            "async-order-processing",
            default_value=False
        )
        
        logger.info(
            "checkout_feature_flags_evaluated",
            fast_inventory=use_fast_inventory,
            async_processing=use_async_processing
        )
        
        try:
            order = json.loads(request.data)
            
            # Use feature flag to determine processing method
            if use_fast_inventory:
                with sentry_sdk.start_span(op="inventory", description="Fast inventory check"):
                    inventory_result = fast_inventory_check(order["cart"])
            else:
                with sentry_sdk.start_span(op="inventory", description="Standard inventory check"):
                    inventory_result = get_inventory(order["cart"])
            
            if use_async_processing:
                # Async processing
                process_order_async.delay(order)
                return {"status": "processing", "async": True}
            else:
                # Synchronous processing
                result = process_order_sync(order)
                return result
                
        except Exception as e:
            # Flag context is automatically included in error reports
            sentry_sdk.capture_exception(e)
            raise
```

---

## 🚀 Demo Implementation Strategy

### 1. Feature Flag Scenarios for Load Testing

```javascript
// Add to React frontend - Products.jsx
const useFeatureFlags = () => {
  const [flags, setFlags] = useState({
    newProductLayout: false,
    fastCheckout: false,
    aiRecommendations: false,
    darkMode: false
  });

  useEffect(() => {
    const client = OpenFeature.getClient();
    
    Promise.all([
      client.getBooleanValue('new-product-layout', false),
      client.getBooleanValue('fast-checkout', false),
      client.getBooleanValue('ai-recommendations', false),
      client.getBooleanValue('dark-mode', false),
    ]).then(([newLayout, fastCheckout, aiRecs, darkMode]) => {
      setFlags({
        newProductLayout: newLayout,
        fastCheckout: fastCheckout,
        aiRecommendations: aiRecs,
        darkMode: darkMode
      });
    });
  }, []);

  return flags;
};
```

### 2. Error Scenarios with Feature Flag Context

```python
# Add error scenarios that correlate with feature flags
@app.route("/flag-dependent-error", methods=["GET"])
def flag_dependent_error():
    use_new_algorithm = client.get_boolean_value("new-algorithm", False)
    
    if use_new_algorithm:
        # New algorithm that might have bugs
        try:
            result = new_complex_algorithm()
        except Exception as e:
            # Error will include flag context automatically
            logger.error("new_algorithm_failed", error=str(e))
            sentry_sdk.capture_exception(e)
            raise
    else:
        # Stable legacy algorithm
        result = legacy_algorithm()
        
    return {"result": result, "algorithm": "new" if use_new_algorithm else "legacy"}
```

### 3. Performance Testing with Flags

```javascript
// Performance variations based on feature flags
const PerformanceTestComponent = () => {
  const flags = useFeatureFlags();
  
  useEffect(() => {
    if (flags.aiRecommendations) {
      // Simulate expensive AI computation
      Sentry.startTransaction({
        name: 'ai_recommendations',
        op: 'ai.computation'
      }, (transaction) => {
        // Expensive operation that might fail
        computeAIRecommendations()
          .then(recommendations => {
            transaction.setData('recommendations_count', recommendations.length);
            transaction.finish();
          })
          .catch(error => {
            transaction.setStatus('internal_error');
            Sentry.captureException(error);
            transaction.finish();
          });
      });
    }
  }, [flags.aiRecommendations]);
};
```

---

## 📊 Monitoring & Analytics

### Flag-Driven Metrics

```python
# Business metrics correlated with feature flags
@app.route("/checkout", methods=["POST"])
def checkout():
    checkout_version = client.get_boolean_value("checkout-v2", False)
    
    with sentry_sdk.start_transaction(
        op="checkout", 
        name=f"checkout_{'v2' if checkout_version else 'v1'}"
    ) as transaction:
        transaction.set_tag("checkout_version", "v2" if checkout_version else "v1")
        
        start_time = time.time()
        
        # Process checkout
        result = process_checkout_v2() if checkout_version else process_checkout_v1()
        
        # Track performance by flag variant
        processing_time = time.time() - start_time
        logger.info(
            "checkout_completed",
            version="v2" if checkout_version else "v1",
            processing_time=processing_time,
            success=result.get("status") == "success"
        )
        
        transaction.set_data("processing_time", processing_time)
        return result
```

### Flag Configuration for Demo

```json
// flagd-demo-config.json
{
  "new-product-layout": {
    "state": "ENABLED",
    "variants": {
      "on": true,
      "off": false
    },
    "defaultVariant": "on",
    "targeting": {
      "if": [
        {
          "in": ["premium", {"var": "customerType"}]
        },
        "on",
        "off"
      ]
    }
  },
  "fast-checkout": {
    "state": "ENABLED", 
    "variants": {
      "on": true,
      "off": false
    },
    "defaultVariant": "off",
    "targeting": {
      "fractional": [
        {"var": "userId"},
        ["on", 30],
        ["off", 70]
      ]
    }
  },
  "ai-recommendations": {
    "state": "ENABLED",
    "variants": {
      "on": true,
      "off": false  
    },
    "defaultVariant": "off"
  }
}
```

---

## 🎯 Benefits for Sentry Demo

1. **Error Correlation**: See exactly which flags were active when errors occurred
2. **Performance Impact**: Compare performance metrics across flag variants
3. **A/B Testing Data**: Monitor user behavior and error rates by flag segments  
4. **Deployment Safety**: Track error rates after flag changes
5. **Context-Rich Debugging**: Full flag state included in error reports

## 📋 Implementation Checklist

### Phase 1: Basic Setup
- [ ] Choose lightweight provider (Flagd recommended)
- [ ] Configure Sentry OpenFeature integration in React
- [ ] Configure Sentry OpenFeature integration in Flask
- [ ] Create basic flag configuration file
- [ ] Test flag evaluation and error correlation

### Phase 2: Demo Scenarios  
- [ ] Implement checkout flow variants
- [ ] Add product layout flags
- [ ] Create flag-dependent error scenarios
- [ ] Add performance variations based on flags

### Phase 3: Advanced Monitoring
- [ ] Implement business metrics by flag variant
- [ ] Add flag-driven load testing scenarios
- [ ] Create flag configuration management workflow
- [ ] Document flag impact on error rates and performance

This feature flag integration will provide rich context for understanding how configuration changes affect application behavior, making your Sentry demo significantly more compelling and realistic.