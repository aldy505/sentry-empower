import "./products.css";
import * as Sentry from "@sentry/react";
import { useEffect, useState } from "react";
import { connect } from "react-redux";
import { PulseLoader } from "react-spinners";
import { addProduct, setProducts } from "../actions";
import ProductCard from "./ProductCard";

function ProductsJoin({ backend }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(backend + "/products-join", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((result) => {
        if (!result.ok) {
          Sentry.setContext("err", {
            status: result.status,
            statusText: result.statusText,
          });
          return Promise.reject();
        } else {
          return result.json();
        }
      })
      .then((data) => setProducts(data.slice(0, 4)))
      .catch((err) => {
        return { ok: false, status: 500 };
      });
  }, []);

  return products.length > 0 ? (
    <div>
      <ul className="products-list">
        {products.map((product, i) => {
          const averageRating = (
            product.reviews.reduce((a, b) => a + (b["rating"] || 0), 0) / product.reviews.length
          ).toFixed(1);

          const stars = [1, 2, 3, 4, 5].map((index) => {
            if (index <= averageRating) {
              return (
                <span className="star" key={index}>
                  &#9733;
                </span>
              );
            } else {
              return (
                <span className="star" key={index}>
                  &#9734;
                </span>
              );
            }
          });

          return <ProductCard key={i} product={product} stars={stars}></ProductCard>;
        })}
      </ul>
    </div>
  ) : (
    <div className="loader-container">
      <PulseLoader color="#f6cfb2" size={150} />
    </div>
  );
}

const mapStateToProps = (state, ownProps) => {
  return {
    cart: state.cart,
    products: state.products,
  };
};

export default connect(mapStateToProps, { setProducts, addProduct })(
  Sentry.withProfiler(ProductsJoin, { name: "ProductsJoin" }),
);
