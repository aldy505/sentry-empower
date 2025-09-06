// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as Sentry from "@sentry/node";

// Imported Functions
import { getProducts, getJoinedProducts, getInventory } from "./db.js";

// Utils
import { getIteratorProcessor } from "./utils.js";

// [START app]
import express, { urlencoded, json } from "express";
import cors from "cors";

const app = express();
const headers = {};

const sentryEventContext = function (req, res, next) {
  const se = req.headers.se;

  if (se !== undefined) {
    Sentry.setTag("se", se);
    headers["se"] = se;
  }

  const customerType = req.headers.customertype;
  if (customerType !== undefined) {
    Sentry.setTag("customerType", customerType);
    headers["customerType"] = customerType;
  }

  const email = req.headers.email;
  if (email !== undefined) {
    Sentry.setUser({ email: email });
    headers["email"] = email;
  }

  // keep executing the router middleware
  next();
};

const dsn = process.env.EXPRESS_APP_DSN;
const release = process.env.RELEASE;
const environment = process.env.EXPRESS_ENV;
const RUBY_BACKEND = process.env.RUBY_BACKEND;

console.log("> DSN", dsn);
console.log("> RELEASE", release);
console.log("> ENVIRONMENT", environment);

async function fetchProducts(req, res) {
  try {
    // This /api call must happen before the DB.products() call or else it's a broken subtrace (if you do it after DB.Products())
    const response = await fetch(RUBY_BACKEND + "/api", { headers: headers });
    console.log("> response", response);

    const products = await getProducts();

    await Sentry.startSpan({
      name: "/products.get_iterator",
      op: "function",
    }, () => getIteratorProcessor(products));

    res.status(200).send(products);
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
}

app.use(cors());
app.use(urlencoded({ extended: true }));
app.use(json());
app.use(sentryEventContext);

// Configure ENV
require("dotenv").config();

app.get("/", (req, res) => {
  res.send(
    "Sentry Express Service says Hello - turn me into a microservice that powers Payments, Shipping, or Customers"
  );
});

app.get("/success", (req, res) => {
  console.log("> success");
  res.send(`success from express`);
});

app.get("/products", fetchProducts);

app.get("/products-join", async (req, res) => {
  try {
    // This /api call must happen before the DB.products() call or else it's a broken subtrace (if you do it after DB.Products())
    const response = await fetch(RUBY_BACKEND + "/api", { headers: headers })
    console.log("> response", response);

    const products = await Sentry.startSpan({
      name: "/products.get_products_join",
      op: "function",
    }, () => getJoinedProducts());

    res.status(200).send(products);
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  }
});

app.post("/checkout", async (req, res) => {
  const order = req.body;
  const cart = order["cart"];
  const form = order["form"];
  let inventory = [];

  // Get Inventory
  inventory = await Sentry.startSpan({
    op: "function",
    name: "getInventory",
  }, () => getInventory(cart));
  console.log("> /checkout inventory", inventory);

  // Process Order
  await Sentry.startSpan({
    op: "function",
    name: "processOrder",
  }, async () => {
    let quantities = cart["quantities"];
    console.log("quantities", quantities);
    for (const cartItem in quantities) {
      if (!hasInventory(cartItem)) {
        throw new Error("Not enough inventory for product");
      }
    }
  });

  res.status(200).send("success");
});

app.get("/api", (req, res) => {
  res.send(`express /api`);
});

app.get("/connect", (req, res) => {
  res.send(`express /connect`);
});

app.get("/organization", (req, res) => {
  res.send(`express /organization`);
});

app.use(Sentry.setupExpressErrorHandler());

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});
// [END app]

function hasInventory(item) {
  return false;
}

