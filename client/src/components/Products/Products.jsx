import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import TabButton from "../TabButton";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import cartProductIcon from "../../assets/products/cart.png";
import "react-toastify/dist/ReactToastify.css";
import "./products.scss";

export default function Products({ selectedCategory, searchQuery }) {
  const { addItem } = useCart();
  const location = useLocation();

  const [activeCategory, setActiveCategory] = useState("canapele");
  const [products, setProducts] = useState([]);

  // Folosește searchQuery dacă există, altfel citește din URL
  const params = new URLSearchParams(location.search);
  const query = searchQuery || params.get("search") || "";

  // Setăm categoria activă la schimbare
  useEffect(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
    }
  }, [selectedCategory]);

  // Fetch produse (global search + fallback)
  useEffect(() => {
    async function fetchProducts() {
      try {
        let url = "http://localhost:8080/api/products"; // fallback
        if (query) {
          url = `http://localhost:8080/api/search?query=${encodeURIComponent(
            query
          )}`;
        }
        const res = await fetch(url);
        if (!res.ok) throw new Error("Eroare la fetch produse");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Eroare fetch produse:", err);
        toast.error("Nu am putut încărca produsele.");
      }
    }

    fetchProducts();
  }, [query]);

  // Filtrare produse
  const displayedProducts = query
    ? products
    : products.filter(
        (product) => product.category.toLowerCase() === activeCategory
      );

  return (
    <div id="products" className="container productsContainer">
      {/* Tabs menu – doar dacă nu e search */}
      {!query && (
        <menu className="category-menu text-center mb-5">
          <TabButton
            isSelected={activeCategory === "canapele"}
            onClick={() => setActiveCategory("canapele")}
          >
            Canapele
          </TabButton>
          <TabButton
            isSelected={activeCategory === "coltare"}
            onClick={() => setActiveCategory("coltare")}
          >
            Colțare
          </TabButton>
          <TabButton
            isSelected={activeCategory === "fotolii"}
            onClick={() => setActiveCategory("fotolii")}
          >
            Fotolii
          </TabButton>
          <TabButton
            isSelected={activeCategory === "paturi"}
            onClick={() => setActiveCategory("paturi")}
          >
            Paturi
          </TabButton>
        </menu>
      )}

      {/* Rezultate căutare */}
      {query && (
        <h3 className="mb-4 text-center">
          Rezultate pentru: <strong>{query}</strong> ({displayedProducts.length}{" "}
          produse)
        </h3>
      )}

      {/* Products Grid */}
      <div className="row row-cols-2 row-cols-sm-2 row-cols-md-4 g-4">
        {displayedProducts.length === 0 && (
          <p className="text-center">Niciun produs găsit</p>
        )}
        {displayedProducts.map((product) => (
          <Link to={`/product/${product.ID}`} key={product.ID}>
            <div className="card h-100 productCard">
              <div className="viewProduct position-relative">
                <img
                  className="card-img-top productImage"
                  src={product.image_url}
                  alt={product.name}
                />
                <img
                  className="cartProductIcon"
                  src={cartProductIcon}
                  alt=""
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addItem(product);
                    toast.success(
                      `${product.name} a fost adăugat în lista de comandă!`
                    );
                  }}
                />
              </div>
              <div className="card-body">
                <span className="card-title productName">{product.name}</span>
                <span className="card-text productPrice">
                  {product.price} MDL
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
