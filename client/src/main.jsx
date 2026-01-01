import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import "leaflet/dist/leaflet.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./main.scss";
import App from "./App.jsx";

const entryPoint = document.getElementById("root");
ReactDOM.createRoot(entryPoint).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
