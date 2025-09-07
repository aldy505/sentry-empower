import * as Sentry from "@sentry/node";
import knex from "knex";

// Knex is the database query builder used in the GCP docs, which
// is why we are using it here. See docs:
// https://cloud.google.com/sql/docs/postgres/connect-app-engine-standard#node.js
const databaseConnection = openDBConnection();

const getProducts = async function () {
  return await Sentry.startSpan({
    name: "getProducts",
    op: "function",
  }, async (span) => {
    let results = [];
    // Retrieve Products
    
    // backorder_inventory is a "sleepy view", run the following query to get current sleep duration:
    // SELECT pg_get_viewdef('backorder_inventory', true)
    const productsQuery = `SELECT * FROM products CROSS JOIN backorder_inventory`;

    const products = await databaseConnection.raw(productsQuery);
    Sentry.setTag("totalProducts", products.rows.length);
    span.setAttribute("totalProducts", products.rows.length);

    // Retrieve Reviews
    let formattedProducts = [];
    for (const product of products.rows) {
      // weekly_promotions is a "sleepy view", run the following query to get current sleep duration:
      // SELECT pg_get_viewdef('weekly_promotions', true)
      const reviewsQuery = `SELECT * FROM reviews, weekly_promotions WHERE productId = ${product.id}`;
      const retrievedReviews = await databaseConnection.raw(reviewsQuery);
      let productWithReviews = product;
      productWithReviews["reviews"] = retrievedReviews.rows;
      formattedProducts.push(productWithReviews);
    }

    return formattedProducts;
  })
};

const getJoinedProducts = async function () {
  return await Sentry.startSpan({
    name: "getJoinedProducts",
    op: "function",
  }, async (span) => {
    // Retrieve Products
    const productsQuery = `SELECT * FROM products`;
    const products = await databaseConnection.raw(productsQuery);
    Sentry.setTag("totalProducts", products.rows.length);

    // Retrieve Reviews
    const reviewsQuery =
      "SELECT reviews.id, products.id AS productid, reviews.rating, reviews.customerId, reviews.description, reviews.created FROM reviews INNER JOIN products ON reviews.productId = products.id";
    const retrievedReviews = await databaseConnection.raw(reviewsQuery);

    // Format Products/Reviews
    let formattedProducts = [];
    for (product of products.rows) {
      let productWithReviews = product;
      productWithReviews["reviews"] = retrievedReviews.rows;
      formattedProducts.push(productWithReviews);
    }

    return formattedProducts;
  });
};

const getInventory = async function (cart) {
  return await Sentry.startSpan({
    name: "getInventory",
    op: "function",
  }, async (span) => {
    console.log("> getting inventory");
    const quantities = cart["quantities"];
    console.log("> quantities", quantities);
    let productIds = [];
    for (productId in quantities) {
      productIds.push(productId);
    }
    productIds = formatArray(productIds);
    console.log("> productIds", productIds);

    const inventory = await databaseConnection.raw(
      `SELECT * FROM inventory WHERE productId in ${productIds}`
    );

    return inventory.rows;
  });
};

function formatArray(ids) {
  let numbers = "";
  for (id of ids) {
    numbers += id + ",";
  }
  const output = "(" + numbers.substring(0, numbers.length - 1) + ")";
  return output;
}

function openDBConnection() {
  let host;
  if (process.env.EXPRESS_ENV === "test" || process.env.EXPRESS_ENV === "self-hosted") {
    // The cloud sql instance connection
    // name doesn't work locally, but the
    // public IP of the instance does.
    host = process.env.DB_HOST;
  } else {
    host = "/cloudsql/" + process.env.DB_CLOUD_SQL_CONNECTION_NAME;
  }

  const db = knex({
    client: "pg",
    connection: {
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      host: host,
    },
  });
  return db;
}

export { getProducts, getJoinedProducts, getInventory };
