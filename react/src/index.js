import "./instrument.js";
import React, { Component, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import * as Sentry from "@sentry/react";
import { createBrowserHistory } from "history";
import { Provider } from "react-redux";
import {
  BrowserRouter,
  createRoutesFromChildren,
  matchRoutes,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { applyMiddleware, compose, createStore } from "redux";
import logger from "redux-logger";
import About from "./components/About";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import Complete from "./components/Complete";
import CompleteError from "./components/CompleteError";
import Employee from "./components/Employee";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Nav from "./components/Nav";
import NotFound from "./components/NotFound";
import Nplusone from "./components/nplusone";
import Product from "./components/Product";
import Products from "./components/Products";
import ProductsJoin from "./components/ProductsJoin";
import ScrollToTop from "./components/ScrollToTop";
import rootReducer from "./reducers";
import { determineBackendType, determineBackendUrl } from "./utils/backendrouter";
import { crasher } from "./utils/errors";

const history = createBrowserHistory();

let ENVIRONMENT;
if (window.location.hostname === "localhost") {
  ENVIRONMENT = "test";
} else {
  // App Engine
  ENVIRONMENT = "production";
}


let BACKEND_URL;
let BACKEND_TYPE;
let FRONTEND_SLOWDOWN;
let RAGECLICK;
let PRODUCTS_API;
let PRODUCTS_EXTREMELY_SLOW;
let PRODUCTS_BE_ERROR;
let ADD_TO_CART_JS_ERROR;
let CHECKOUT_SUCCESS;
let ERROR_BOUNDARY;
const DSN = process.env.REACT_APP_DSN;
const RELEASE = process.env.REACT_APP_RELEASE;

console.log("ENVIRONMENT", ENVIRONMENT);
console.log("RELEASE", RELEASE);

const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

const sentryReduxEnhancer = Sentry.createReduxEnhancer({});

const store = createStore(rootReducer, compose(applyMiddleware(logger), sentryReduxEnhancer));

const container = document.getElementById("root");
const root = createRoot(container, {
  // Callback called when an error is thrown and not caught by an ErrorBoundary.
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn('Uncaught error', error, errorInfo.componentStack);
  }),
  // Callback called when React catches an error in an ErrorBoundary.
  onCaughtError: Sentry.reactErrorHandler(),
  // Callback called when React automatically recovers from errors.
  onRecoverableError: Sentry.reactErrorHandler(),
});

class App extends Component {
  constructor() {
    super();
    this.state = {
      cart: {
        items: [],
        quantities: {},
        total: 0,
      },
      products: {
        response: [],
      },
    };

    const queryParams = new URLSearchParams(history.location.search);

    // Set desired backend
    const backendTypeParam = queryParams.get("backend");
    const backendType = determineBackendType(backendTypeParam);
    BACKEND_TYPE = backendType;
    BACKEND_URL = determineBackendUrl(backendType);

    console.log(`> backendType: ${backendType} | backendUrl: ${BACKEND_URL}`);

    // These also get passed via request headers (see window.fetch below)

    // NOTE: because the demo extracts tags from the scope in order to pass them
    // as headers to the backend, we need to make sure we are calling `setTag()`
    // on the current scope. We don't want to call Sentry.setTag() as is usually
    // recommended (https://docs.sentry.io/platforms/javascript/enriching-events/scopes/#isolation-scope),
    // because that would set the tag on the isolation scope, and make it inaccessible
    // when it's time to set the headers.
    const currentScope = Sentry.getCurrentScope();

    const customerType = ["medium-plan", "large-plan", "small-plan", "enterprise"][Math.floor(Math.random() * 4)];
    currentScope.setTag("customerType", customerType);

    const se = queryParams.get("se");
    if (se) {
      // Route components (navigation changes) will now have 'se' tag on scope
      currentScope.setTag("se", se);
      // for use in Checkout.js when deciding whether to pre-fill form
      // lasts for as long as the tab is open
      sessionStorage.setItem("se", se);
    }

    // see `cexp` fixture in tda/conftest.py
    const cexp = queryParams.get("cexp");
    if (cexp) {
      currentScope.setTag("cexp", cexp);

      if (cexp === "products_extremely_slow") {
        PRODUCTS_EXTREMELY_SLOW = true;
      } else if (cexp === "products_be_error") {
        PRODUCTS_BE_ERROR = true;
      } else if (cexp === "add_to_cart_js_error") {
        ADD_TO_CART_JS_ERROR = true;
      } else if (cexp === "checkout_success") {
        CHECKOUT_SUCCESS = true;
      }
    }

    if (queryParams.get("frontendSlowdown") === "true") {
      console.log("> frontend-only slowdown: true");
      FRONTEND_SLOWDOWN = true;
      currentScope.setTag("frontendSlowdown", true);
    } else {
      console.log("> frontend + backend slowdown");
      currentScope.setTag("frontendSlowdown", false);
    }

    if (queryParams.get("api") === "join") {
      if (PRODUCTS_EXTREMELY_SLOW || PRODUCTS_BE_ERROR || FRONTEND_SLOWDOWN) {
        throw new Error(
          "?products_api=join can't be combined with ?cexp=products_extremely_slow, ?cexp=products_be_error, or ?frontendSlowdown=true",
        );
      }
      PRODUCTS_API = "products-join";
      currentScope.setTag("api", "products-join");
    } else {
      PRODUCTS_API = "products";
      currentScope.setTag("api", "products");
    }

    if (queryParams.get("rageclick") === "true") {
      RAGECLICK = true;
    }

    if (queryParams.get("userFeedback")) {
      sessionStorage.setItem("userFeedback", queryParams.get("userFeedback"));
    } else {
      sessionStorage.setItem("userFeedback", "false");
    }
    sessionStorage.removeItem("lastErrorEventId");

    currentScope.setTag("backendType", backendType);

    let email = null;
    if (queryParams.get("userEmail")) {
      email = queryParams.get("userEmail");
    } else {
      // making fewer emails so event and user counts for an Issue are not the same
      const array = [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
      ];
      const a = array[Math.floor(Math.random() * array.length)];
      const b = array[Math.floor(Math.random() * array.length)];
      const c = array[Math.floor(Math.random() * array.length)];
      email = a + b + c + "@example.com";
    }
    currentScope.setUser({ email: email });

    const errorBoundary = queryParams.get("error_boundary");
    if (errorBoundary) {
      ERROR_BOUNDARY = errorBoundary;
      currentScope.setTag("error_boundary", errorBoundary);
    }

    // Automatically append `se`, `customerType` and `userEmail` query params to all requests
    // (except for requests to Sentry)
    const nativeFetch = window.fetch;
    window.fetch = (...args) => {
      const url = args[0];
      // When TDA is run in 'mock' mode inside Docker mini-relay will be ingesting on port 9989, see:
      // https://github.com/sentry-demos/empower/blob/79bed0b78fb3d40dff30411ef26c31dc7d4838dc/mini-relay/Dockerfile#L9
      const ignore_match = url.match(/^http[s]:\/\/([^.]+\.ingest\.sentry\.io\/|localhost:9989|127.0.0.1:9989).*/);
      if (!ignore_match) {
        Sentry.withScope((scope) => {
          let se, customerType, email;
          [se, customerType] = [scope._tags.se, scope._tags.customerType];
          email = scope._user.email;
          args[1].headers = { ...args[1].headers, se, customerType, email };
        });
      }
      return nativeFetch.apply(window, args);
    };

    // Crasher parses query params sent by /tests for triggering crashes for Release Health
    crasher();
  }

  render() {
    return (
      <Provider store={store}>
        <BrowserRouter history={history}>
          <ScrollToTop />
          <Nav frontendSlowdown={FRONTEND_SLOWDOWN} />
          <div id="body-container">
            <SentryRoutes>
              <Route path="/" element={<Home backend={BACKEND_URL} frontendSlowdown={FRONTEND_SLOWDOWN} />}></Route>
              <Route path="/about" element={<About backend={BACKEND_URL} history={history} />}></Route>
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/checkout"
                element={
                  <Checkout
                    backend={BACKEND_URL}
                    rageclick={RAGECLICK}
                    checkout_success={CHECKOUT_SUCCESS}
                    history={history}
                  />
                }
              ></Route>
              <Route path="/complete" element={<Complete />} />
              <Route path="/error" element={<CompleteError />} />
              <Route path="/employee/:id" element={<Employee />}></Route>
              <Route path="/product/:id" element={<Product />}></Route>
              <Route
                path="/products"
                element={
                  <Products
                    backend={BACKEND_URL}
                    frontendSlowdown={false}
                    productsApi={PRODUCTS_API}
                    productsExtremelySlow={PRODUCTS_EXTREMELY_SLOW}
                    productsBeError={PRODUCTS_BE_ERROR}
                    addToCartJsError={ADD_TO_CART_JS_ERROR}
                  />
                }
              ></Route>
              <Route
                path="/products-fes" // fes = frontend slowdown (only frontend)
                element={<Products backend={BACKEND_URL} frontendSlowdown={true} />}
              ></Route>
              <Route path="/nplusone" element={<Nplusone backend={BACKEND_URL} />} />
              <Route path="/products-join" element={<ProductsJoin backend={BACKEND_URL} />}></Route>
              <Route path="*" element={<NotFound />} />
            </SentryRoutes>
          </div>
          <Footer backend={BACKEND_URL} errorBoundary={ERROR_BOUNDARY} />
        </BrowserRouter>
      </Provider>
    );
  }
}

// React-router in use here https://reactrouter.com/web/guides/quick-start
root.render(<App />);
