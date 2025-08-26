import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import ProductPage from "./pages/ProductPage/ProductPage";
import ScrollToTop from "./components/ScrollToTop";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import CartPage from "./pages/CartPage/CartPage";
import { CartProvider } from "./context/CartContext";
import CartModal from "./components/CartModal/CartModal";
import Products from "./components/Products/Products";
import SearchResults from "./components/SearchResults/SearchResults";
// import HeaderIcons from "./components/HeaderIcons/HeaderIcons";

//TODO: Specifying product dimensions at ProductPage

function App() {
  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        {/* <HeaderIcons /> */}
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<Products />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route path="/product/:id" element={<ProductPage />} />
            {/* <Route path="/cart" element={<CartPage />} /> */}
          </Routes>
          <ToastContainer position="bottom-right" autoClose={2000} />
          <CartModal />
        </main>
      </Router>
    </CartProvider>
  );
}

export default App;
