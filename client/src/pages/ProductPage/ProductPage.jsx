import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./productPage.scss";

import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";

export default function ProductPage() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);

  // 🎨 Nou: state pentru culoare
  const [selectedColor, setSelectedColor] = useState("default");

  // Exemplar de culori (până ai imagini generate de AI)
  const colorOptions = [
    { name: "Gri", value: "gray", hex: "#808080" },
    { name: "Bej", value: "beige", hex: "#D9CBB3" },
    { name: "Navy", value: "navy", hex: "#001F54" },
    { name: "Verde", value: "olive", hex: "#556B2F" },
    { name: "Burgundy", value: "burgundy", hex: "#800020" },
  ];

  useEffect(() => {
    async function fetchProduct() {
      if (!id) {
        setLoading(false);
        setProduct(null);
        return;
      }
      try {
        const res = await fetch(`http://localhost:8080/api/products/${id}`);
        if (!res.ok) throw new Error("Eroare la încărcarea produsului");
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error(err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-center py-5">Se încarcă...</div>;
  if (!product)
    return <div className="text-center py-5">Produsul nu a fost găsit</div>;

  function decreaseQuantity() {
    if (quantity > 1) setQuantity(quantity - 1);
  }
  function increaseQuantity() {
    setQuantity(quantity + 1);
  }

  // Imagine de culoare – momentan doar schimbăm URL-ul ca exemplu
  const displayedImage =
    selectedColor === "default"
      ? product.image_url
      : `/images/${product.id}_${selectedColor}.jpg`; // <- aici pui imaginile generate de AI

  return (
    <>
      <Nav />
      <div className="container productPage py-5">
        <div className="row g-4">
          <div className="col-md-6">
            <img
              src={displayedImage}
              alt={product.name}
              className="img-fluid shadow productImage"
            />
          </div>

          <div className="col-md-6 d-flex flex-column justify-content-center">
            <h1 className="productName mb-3">{product.name}</h1>
            <p className="productPrice mb-3">{product.price} MDL</p>
            <p className="productDescription mb-4">
              {product.description ||
                "Aici se află descrierea produsului selectat de dumneavoastră."}
            </p>

            {/* 🔵 Selectare culoare */}
            <div className="mb-4">
              <h6>Alege culoarea:</h6>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {colorOptions.map((c) => (
                  <button
                    key={c.value}
                    className={`colorBtn ${
                      selectedColor === c.value ? "active" : ""
                    }`}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setSelectedColor(c.value)}
                  >
                    {/* Text vizibil: */}
                    {/* <span className="colorText">{c.name}</span> */}
                  </button>
                ))}
              </div>
            </div>

            {/* Cantitate */}
            <div className="quantityContainer mb-4">
              <button
                className="quantityBtn"
                onClick={decreaseQuantity}
                disabled={quantity <= 1}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="quantityInput"
              />
              <button className="quantityBtn" onClick={increaseQuantity}>
                +
              </button>
            </div>

            <button
              className="btn addToCartBtn"
              onClick={() => {
                addItem({ ...product, selectedColor }, quantity);
                toast.success(
                  `${product.name} (${selectedColor}) a fost adăugat în coș!`
                );
              }}
            >
              Adaugă în coș
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
