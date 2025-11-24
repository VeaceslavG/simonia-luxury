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
import { useEffect } from "react";

import { AuthProvider } from "./context/AuthContext";
import Register from "./pages/Auth/Register";
import Login from "./pages/Auth/Login";
import Profile from "./pages/Auth/Profile";
import AccountPage from "./pages/AccountPage/AccountPage";
import CheckoutPage from "./pages/CheckoutPage/CheckoutPage";

import AdminApp from "./admin/AdminApp";

function App() {
  useEffect(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    localStorage.removeItem("guestCart");
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          {/* <HeaderIcons /> */}
          <main>
            <Routes>
              <Route path="/admin/*" element={<AdminApp />} />
              <Route path="/*" element={<HomePage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="/products" element={<Products />} />
              <Route path="/search-results" element={<SearchResults />} />
              <Route path="/product/:id" element={<ProductPage />} />
              {/* <Route path="/cart" element={<CartPage />} /> */}
              <Route path="/checkout" element={<CheckoutPage />} />

              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
            <ToastContainer position="bottom-right" autoClose={2000} />
            <CartModal />
          </main>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
