import ReactDOM from "react-dom/client";
import "leaflet/dist/leaflet.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./main.scss";
import App from "./App.jsx";

// import { CartProvider } from "./context/CartContext.jsx";

const entryPoint = document.getElementById("root");
ReactDOM.createRoot(entryPoint).render(
  // <CartProvider>
  <App />
  // </CartProvider>
);
