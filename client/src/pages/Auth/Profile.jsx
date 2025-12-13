import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import trashIcon from "../../assets/cartModal/trashIcon.png";
import defaultImage from "../../assets/default_image.png";
import { API_URL } from "../../config/api";

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
        fetch(`${API_URL}/api/orders`, {
          method: "GET",
          credentials: "include",
        }),
        fetch(`${API_URL}/api/cart`, {
          method: "GET",
          credentials: "include",
        }),
      ]);

      if (!ordersRes.ok) throw new Error("Orders fetch failed");
      if (!cartRes.ok) throw new Error("Cart fetch failed");

      const ordersData = await ordersRes.json();
      const cartData = await cartRes.json();

      console.log("Orders fetched:", ordersData);
      console.log("Cart fetched:", cartData);

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

  const getProductImage = (item) => {
    if (!item.product || !item.product.image_urls) {
      return "/default-image.jpg";
    }

    // Procesează image_urls similar cu ProductPage
    let imageArray = [];
    if (typeof item.product.image_urls === "string") {
      imageArray = item.product.image_urls
        .split(",")
        .filter((url) => url.trim());
    } else if (Array.isArray(item.product.image_urls)) {
      imageArray = item.product.image_urls.filter((url) => url);
    }

    const firstImage = imageArray[0]?.trim();
    if (firstImage) {
      const cleanPath = firstImage.startsWith("/")
        ? firstImage
        : `/${firstImage}`;
      return `${API_URL}${cleanPath}`;
    } else {
      return defaultImage;
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

        <h3 className="sectionProfileTitle">Modelele mele selectate</h3>
        {cartItems.length === 0 ? (
          <p>Nu ai selectat încă niciun model</p>
        ) : (
          <ul>
            {cartItems.map((item, index) => {
              const productImage = getProductImage(item);

              return (
                <li key={`cart-${index}-${item.productId}`}>
                  <Link
                    to={`/product/${item.productId}`}
                    className="cartProfileItemLink"
                  >
                    <img
                      src={productImage}
                      alt={item.product?.name || "Product"}
                      onError={(e) => {
                        e.target.src = defaultImage;
                      }}
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
              );
            })}
          </ul>
        )}

        <h3 className="sectionProfileTitle">Cererile mele personalizate</h3>
        {orders.length === 0 ? (
          <p>Nu am cereri</p>
        ) : (
          <ul>
            {orders.map((order) => (
              <div key={order.id} className="orderCard">
                <div className="orderHeader">
                  <h4>Cererea #{order.id}</h4>
                  <span className="orderDate">
                    {order.CreatedAt || order.created_at
                      ? formatDate(order.CreatedAt || order.created_at)
                      : "Date indisponibile"}
                  </span>
                </div>
                <div className="orderStatus">
                  Status:
                  <span className={`status ${order.Status}`}>
                    {order.status === "pending"
                      ? "În așteptare"
                      : order.status === "completed"
                      ? "Finalizată"
                      : order.status}
                  </span>
                </div>
                <div className="orderItems">
                  <h5>Modele incluse în cerere:</h5>
                  <ul>
                    {order.items?.map((item) => {
                      const productImage = getProductImage(item);

                      return (
                        <li key={item.id} className="orderItem">
                          <img
                            src={productImage}
                            alt={item.product?.name}
                            onError={(e) => {
                              e.target.src = defaultImage;
                            }}
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
                      );
                    })}
                  </ul>
                </div>
                <div className="orderTotal">
                  Estimare totală:{" "}
                  <strong>
                    {order.total || order.Total
                      ? (order.total || order.Total).toFixed(2)
                      : "0.00"}{" "}
                    MDL
                  </strong>
                </div>
              </div>
            ))}
          </ul>
        )}

        <button onClick={handleLogout}>Ieși din cont</button>
      </div>
    </>
  );
}
