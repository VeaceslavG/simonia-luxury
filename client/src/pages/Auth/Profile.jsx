import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";

export default function Profile() {
  const { user, token, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="text-center mt-4">Loading...</p>;
  if (!user) return <p className="text-center mt-4">You are not logged in.</p>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">My Profile</h2>
      <p>Name: {user.Name}</p>
      <p>Email: {user.Email}</p>

      <h3 className="mt-4 font-semibold">My Cart</h3>
      {cartItems.length === 0 ? (
        <p>Cart is empty</p>
      ) : (
        <ul>
          {cartItems.map((item) => (
            <li key={item.ID}>
              {item.product?.name || "Unknown Product"} - {item.quantity} x{" "}
              {item.product?.price || 0} MDL
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-4 font-semibold">My Orders</h3>
      {orders.length === 0 ? (
        <p>No orders yet</p>
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

      <button
        onClick={logout}
        className="bg-red-600 text-white py-2 px-4 rounded mt-4"
      >
        Logout
      </button>
    </div>
  );
}
