import { useState } from "react";
import { useParams } from "react-router-dom";
import { productsData } from "../../components/Products/productsData";
import "bootstrap/dist/css/bootstrap.min.css";
import "./productPage.scss";

import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";

//TODO: Specifying product dimensions

export default function ProductPage() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);

  const product = productsData.find((p) => p.id.toString() === id);

  if (!product) {
    return <div className="text-center py-5">Product not found</div>;
  }

  function handleAddToCart() {
    console.log("Added to cart:", {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
    });
  }

  function decreaseQuantity() {
    if (quantity > 1) setQuantity(quantity - 1);
  }

  function increaseQuantity() {
    setQuantity(quantity + 1);
  }

  return (
    <>
      <Nav />
      <div className="container productPage py-5">
        <div className="row g-4">
          <div className="col-md-6">
            <img
              src={product.image}
              alt={product.name}
              className="img-fluid shadow productImage"
            />
          </div>

          <div className="col-md-6 d-flex flex-column justify-content-center">
            <h1 className="productName mb-3">{product.name}</h1>
            <p className="productPrice mb-3">{product.price}</p>
            <p className="productDescription mb-4">
              {product.description ||
                "Aici se află descrierea produsului selectat de dumneavoastră."}
            </p>

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
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="quantityInput"
              />
              <button className="quantityBtn" onClick={increaseQuantity}>
                +
              </button>
            </div>

            <button className="btn addToCartBtn" onClick={handleAddToCart}>
              Adaugă în coș
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
