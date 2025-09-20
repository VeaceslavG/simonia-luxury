import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import trashIcon from "../../assets/cartModal/trashIcon.png";

export default function Profile() {
  const { user, token, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { removeItem } = useCart();

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const [ordersRes, cartRes] = await Promise.all([
          fetch("http://localhost:8080/api/orders", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:8080/api/cart", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        console.log("Orders response:", ordersRes);
        console.log("Cart response:", cartRes);

        if (!ordersRes.ok) throw new Error("Orders fetch failed");
        if (!cartRes.ok) throw new Error("Cart fetch failed");

        const ordersData = await ordersRes.json();
        const cartData = await cartRes.json();

        console.log("Orders fetched:", ordersData);
        console.log("Cart fetched:", cartData);

        setOrders(ordersData);
        setCartItems(cartData);
      } catch (err) {
        console.error("Error fetching profile data", err);
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>You are not logged in.</p>;

  return (
    <>
      <div className="profilePageContainer">
        <h2 className="profileTitle">Profilul meu</h2>
        <p className="profileInfo">Nume: {user.Name}</p>
        <p className="profileInfo">Email: {user.Email}</p>

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
                  onClick={async () => {
                    await removeItem(item.ID);
                    setCartItems((prev) =>
                      prev.filter((ci) => ci.ID !== item.ID)
                    );
                  }}
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

        <button onClick={logout}>Logout</button>
      </div>
    </>
  );
}
