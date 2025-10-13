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

  const displayedImage = product.image_url;

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
                addItem({ ...product }, quantity);
                toast.success(`${product.name} a fost adăugat în coș!`);
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
