import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import trashIcon from "../../assets/cartModal/trashIcon.png";

export default function Profile() {
  const { user, logout } = useAuth();
  const { cartItems, removeItem } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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
    fetchData();
  }, [user, location.state?.orderSuccess]);

  async function fetchData() {
    try {
      setError(null);
      console.log("🔄 Fetching orders...");

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

      if (!ordersRes.ok) throw new Error("Orders fetch failed");
      if (!cartRes.ok) throw new Error("Cart fetch failed");

      const ordersData = await ordersRes.json();
      const cartData = await cartRes.json();

      console.log("✅ Orders fetched:", ordersData);
      console.log("✅ Cart fetched:", cartData);

      setOrders(ordersData);
    } catch (err) {
      console.error("Error fetching profile data", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleRemoveItem = async (itemId) => {
    try {
      await removeItem(itemId);
    } catch (err) {
      console.error("Error removing item:", err);
      setError("Eroare la ștergerea produsului");
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("ro-RO", options);
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
              <div key={order.ID} className="orderCard">
                <div className="orderHeader">
                  <h4>Comanda #{order.ID}</h4>
                  <span className="orderDate">
                    {order.CreatedAt
                      ? formatDate(order.CreatedAt)
                      : "Date indisponibile"}
                  </span>
                </div>
                <div className="orderStatus">
                  Status:{" "}
                  <span className={`status ${order.Status}`}>
                    {order.Status === "pending"
                      ? "În așteptare"
                      : order.Status === "completed"
                      ? "Finalizată"
                      : order.Status}
                  </span>
                </div>
                <div className="orderItems">
                  <h5>Produse comandate:</h5>
                  <ul>
                    {order.items?.map((item) => (
                      <li key={item.ID} className="orderItem">
                        <img
                          src={item.product?.image_url}
                          alt={item.product?.name}
                          className="orderProductImage"
                        />
                        <div className="orderItemDetails">
                          <span className="productName">
                            {item.product?.name}
                          </span>
                          <span className="productQuantity">
                            {item.quantity} x {item.price} MDL
                          </span>
                        </div>
                        <span className="itemTotal">
                          {(item.quantity * item.price).toFixed(2)} MDL
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="orderTotal">
                  Total comandă: <strong>{order.total?.toFixed(2)} MDL</strong>
                </div>
              </div>
            ))}
          </ul>
        )}

        <button onClick={handleLogout}>Logout</button>
      </div>
    </>
  );
}
