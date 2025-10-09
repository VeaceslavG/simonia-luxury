import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import trashIcon from "../../assets/cartModal/trashIcon.png";

export default function Profile() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { removeItem } = useCart();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
    window.location.reload();
  }

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setError(null);
        const [ordersRes, cartRes] = await Promise.all([
          fetch("http://localhost:8080/api/orders", {
            method: "GET",
            credentials: "include",
          }),
          fetch("http://localhost:8080/api/cart", {
            method: "GET",
            credentials: "include",
          }),
        ]);

        console.log("Orders response:", ordersRes.status);
        console.log("Cart response:", cartRes.status);

        // Verifică dacă răspunsurile sunt OK
        if (!ordersRes.ok) {
          if (ordersRes.status === 401) {
            throw new Error("Nu ești autentificat");
          }
          throw new Error(`Eroare orders: ${ordersRes.status}`);
        }

        if (!cartRes.ok) {
          if (cartRes.status === 401) {
            throw new Error("Nu ești autentificat pentru a vedea coșul");
          }
          throw new Error(`Eroare cart: ${cartRes.status}`);
        }

        const ordersData = await ordersRes.json();
        const cartData = await cartRes.json();

        console.log("Orders fetched:", ordersData);
        console.log("Cart fetched:", cartData);

        setOrders(ordersData);
        setCartItems(cartData);
      } catch (err) {
        console.error("Error fetching profile data", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const handleRemoveItem = async (itemId) => {
    try {
      await removeItem(itemId);
      setCartItems((prev) => prev.filter((ci) => ci.ID !== itemId));
    } catch (err) {
      console.error("Error removing item:", err);
      setError("Eroare la ștergerea produsului");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>You are not logged in.</p>;

  return (
    <>
      <div className="profilePageContainer">
        <h2 className="profileTitle">Profilul meu</h2>
        {error && <p className="error-message">Eroare: {error}</p>}

        <p className="profileInfo">Nume: {user?.name}</p>
        <p className="profileInfo">Email: {user?.email}</p>
        <p className="profileInfo">Phone: {user?.phone}</p>

        <h3 className="sectionProfileTitle">Coșul meu</h3>
        {cartItems.length === 0 ? (
          <p>Coșul este gol</p>
        ) : (
          <ul>
            {cartItems.map((item) => (
              <li key={item.ID}>
                <Link
                  to={`/product/${item.product?.ID}`}
                  className="cartProfileItemLink"
                >
                  <img
                    src={item.product?.image_url}
                    alt={item.product?.name || "Product"}
                    className="productProfileImage"
                  />
                  <span>
                    {item.product?.name} - {item.quantity} x{" "}
                    {item.product?.price} MDL
                  </span>
                </Link>
                <button
                  className="removeCartItemBtn"
                  onClick={() => handleRemoveItem(item.ID)}
                >
                  <img src={trashIcon} alt="Remove" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <h3 className="sectionProfileTitle">Comenzile mele</h3>
        {orders.length === 0 ? (
          <p>Nu am comenzi</p>
        ) : (
          <ul>
            {orders.map((order) => (
              <li key={order.ID}>
                Order #{order.ID} - {order.items?.length || 0} items - $
                {order.items?.reduce(
                  (total, i) => total + (i.price || 0) * (i.quantity || 0),
                  0
                )}
              </li>
            ))}
          </ul>
        )}

        <button onClick={handleLogout}>Logout</button>
      </div>
    </>
  );
}
