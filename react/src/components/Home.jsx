import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import plantsBackground from "../assets/plants-background-img.jpg";
import Button from "./ButtonLink";

const divStyle = {
  backgroundImage: "url(" + plantsBackground + ")",
};

function Home({ frontendSlowdown, backend }) {
  useEffect(() => {
    try {
      // This should be the only http request for home page, for health check purposes
      fetch(backend + "/success", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      Sentry.captureException(err);
    }
  }, []);

  return (
    <div className="hero sentry-unmask">
      <div className="hero-bg-img" style={divStyle}></div>
      <div className="hero-content">
        <h1>Empower your plants</h1>
        <p>Keep your houseplants happy.</p>
        <Button to={frontendSlowdown ? "/products-fes" : "/products"}>Browse products</Button>
      </div>
    </div>
  );
}

export default Home;
