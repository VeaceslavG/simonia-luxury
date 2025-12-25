import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import defaultImage from "../../assets/default_image.png";
import "./checkoutPage.scss";
import { API_URL } from "../../config/api";

export default function CheckoutPage() {
  const { cartItems, cartSubtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  // Verifică dacă coșul este gol
  useEffect(() => {
    if (cartItems.length === 0 && !location.state?.fromCart) {
      navigate("/cart");
    }
  }, [cartItems.length, navigate, location]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // validari
    if (!formData.phone.trim()) {
      toast.error("Numărul de telefon este obligatoriu");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Numele este obligatoriu");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          notes: formData.notes,
          items: cartItems.map((item) => ({
            productId: item.productId || item.product?.ID,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const newOrder = await response.json();

      clearCart();

      toast.success(
        "Cererea ta a fost trimisă cu succes! Te vom contacta în curând pentru detalii."
      );

      navigate("/account", {
        state: {
          orderSuccess: true,
          newOrderId: newOrder.ID,
        },
      });
    } catch (err) {
      console.error("Error creating order:", err);
      toast.error("Eroare la plasarea comenzii: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFullImageUrl = (imagePath) => {
    if (!imagePath) return "/default-image.jpg";

    if (imagePath.startsWith("http")) return imagePath;

    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;

    return `${API_URL}${cleanPath}`;
  };

  const getProductImage = (item) => {
    if (!item.product || !item.product.image_urls) {
      return defaultImage;
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
      return getFullImageUrl(firstImage);
    }

    return defaultImage;
  };

  if (cartItems.length === 0) {
    return (
      <>
        <Nav />
        <div className="checkoutPage">
          <div className="container">
            <h1>Trimite cererea ta personalizată</h1>
            <p>
              Lista ta de modele este goală. Explorează lucrările noastre și
              selectează modelele care te inspiră.
            </p>
            <button
              onClick={() => navigate("/")}
              className="continueShoppingBtn"
            >
              Vezi lucrările noastre
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="checkoutPage">
        <div className="container">
          <h1>Trimite cererea ta personalizată</h1>

          <p className="customNotice">
            Majoritatea modelelor prezentate pe site au fost realizate la
            comandă. Poți solicita un design asemănător sau unul complet
            personalizat, adaptat preferințelor tale.
          </p>

          <div className="checkoutLayout">
            {/* Detalii cerere */}
            <div className="orderSummary">
              <h2>Detalii cerere</h2>
              <div className="orderItems">
                {cartItems.map((item, index) => {
                  const productImage = getProductImage(item);

                  return (
                    <div key={index} className="orderItem">
                      <img
                        src={productImage}
                        alt={item.product?.name}
                        onError={(e) => {
                          e.target.src = defaultImage;
                        }}
                      />
                      <div className="itemDetails">
                        <h4>
                          {item.product?.name || `Produs #${item.productId}`}
                        </h4>
                        <p>Cantitate: {item.quantity}</p>
                        <p>
                          Preț:{" "}
                          {((item.product?.price_cents ?? 0) / 100).toFixed(2) *
                            item.quantity || 0}{" "}
                          MDL
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="orderTotal">
                <h3>Total: {cartSubtotal} MDL</h3>
              </div>
            </div>

            {/* Formular Date Contact */}
            <div className="contactForm">
              <h2>Date de contact</h2>
              <form onSubmit={handleSubmit}>
                <div className="formGroup">
                  <label>Nume complet *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nume"
                    required
                  />
                </div>

                <div className="formGroup">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="E-mail"
                  />
                </div>

                <div className="formGroup">
                  <label>Număr de telefon *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Telefon"
                    required
                  />
                  <small>
                    Vei fi contactat la acest număr pentru confirmare
                  </small>
                </div>

                <div className="formGroup">
                  <label>Adresă de livrare</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Strada, număr, bloc, apartament"
                  />
                </div>

                <div className="formGroup">
                  <label>Oraș</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Orașul tău"
                  />
                </div>

                <div className="formGroup">
                  <label>Note comandă (opțional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Observații, preferințe, etc."
                    rows="3"
                  />
                </div>

                <button
                  type="submit"
                  className="submitOrderBtn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Se trimite cererea..." : "Trimite cererea"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
