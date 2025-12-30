import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import TabButton from "../TabButton";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import cartProductIcon from "../../assets/products/cart.png";
import defaultImage from "../../assets/default_image.png";
import "react-toastify/dist/ReactToastify.css";
import "./products.scss";
import { API_URL } from "../../config/api";

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
        let url = `${API_URL}/api/products`;
        if (query)
          url = `${API_URL}/api/search?query=${encodeURIComponent(query)}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Eroare la fetch produse");

        const data = await res.json();
        const productsArray = Array.isArray(data) ? data : [];

        setProducts(productsArray);
      } catch {
        toast.error("Nu am putut încărca produsele.");
      }
    }

    fetchProducts();
  }, [query]);

  // Filtrare produse
  const displayedProducts = useMemo(() => {
    if (query) return products;

    return products.filter((product) => {
      if (!product?.category?.name) return false;
      return product.category.name.toLowerCase() === activeCategory;
    });
  }, [products, query, activeCategory]);

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
                  loading="lazy"
                  decoding="async"
                  className="card-img-top productImage"
                  src={
                    product.image_urls?.[0]
                      ? `${API_URL}${
                          product.image_urls[0].startsWith("/") ? "" : "/"
                        }${product.image_urls[0]}`
                      : defaultImage
                  }
                  alt={product.name}
                />
                <img
                  loading="lazy"
                  decoding="async"
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
                  {((product.price_cents ?? 0) / 100).toFixed(2)} MDL
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
