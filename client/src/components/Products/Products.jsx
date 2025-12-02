import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import TabButton from "../TabButton";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import cartProductIcon from "../../assets/products/cart.png";
import defaultImage from "../../assets/default_image.png";
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
        let url = "http://localhost:8080/api/products";
        if (query) {
          url = `http://localhost:8080/api/search?query=${encodeURIComponent(
            query
          )}`;
        }
        console.log("🔄 Fetching products from:", url);

        const res = await fetch(url);
        if (!res.ok) throw new Error("Eroare la fetch produse");

        const data = await res.json();
        const productsArray = Array.isArray(data) ? data : [];

        console.log("📦 Products received:", productsArray);
        if (productsArray.length > 0) {
          console.log("🔍 First product structure:", productsArray[0]);
          console.log("📋 First product category:", productsArray[0].category);
        }

        setProducts(productsArray);
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
    : products.filter((product) => {
        // Verificări de siguranță
        if (!product.category) return false;
        if (!product.category.name) return false;

        return product.category.name.toLowerCase() === activeCategory;
      });

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
            isSelected={activeCategory === "dormitoare"}
            onClick={() => setActiveCategory("dormitoare")}
          >
            Dormitoare
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
          <Link to={`/product/${product.id}`} key={product.id}>
            <div className="card h-100 productCard">
              <div className="viewProduct position-relative">
                <img
                  className="card-img-top productImage"
                  src={
                    product.image_urls && product.image_urls.length > 0
                      ? `http://localhost:8080${product.image_urls[0]}`
                      : defaultImage
                  }
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
