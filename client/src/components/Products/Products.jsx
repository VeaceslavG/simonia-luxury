import { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import TabButton from "../TabButton";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import defaultImage from "../../assets/default_image.png";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "../../config/api";
import { useInView } from "react-intersection-observer";
import "./products.scss";

export default function Products({ selectedCategory, searchQuery }) {
  const { addItem } = useCart();
  const location = useLocation();

  const [activeCategory, setActiveCategory] = useState("canapele");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Folosește searchQuery dacă există, altfel citește din URL
  const params = new URLSearchParams(location.search);
  const query = searchQuery || params.get("search") || "";

  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px",
  });

  // Setăm categoria activă la schimbare
  useEffect(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
    }
  }, [selectedCategory]);

  // Fetch produse (global search + fallback)
  useEffect(() => {
    if (!inView) return;

    const controller = new AbortController();

    const loadProducts = async () => {
      try {
        setLoading(true);
        const url = query
          ? `${API_URL}/api/search?query=${encodeURIComponent(query)}`
          : `${API_URL}/api/products`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Nu am putut încărca produsele.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
    return () => controller.abort();
  }, [query, inView]);

  // Filtrare produse
  const displayedProducts = useMemo(() => {
    if (query) return products;

    return products.filter((product) => {
      if (!product?.category?.name) return false;
      return product.category.name.toLowerCase() === activeCategory;
    });
  }, [products, query, activeCategory]);

  return (
    <div ref={ref} id="products" className="container productsContainer">
      {/* Tabs menu – doar dacă nu e search */}
      {!query && (
        <menu className="category-menu text-center mb-5">
          {["canapele", "coltare", "dormitoare"].map((cat) => (
            <TabButton
              key={cat}
              isSelected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </TabButton>
          ))}
        </menu>
      )}

      {loading && <p className="text-center w-100">Se încarcă produsele…</p>}

      {/* Rezultate căutare */}
      {query && (
        <h3 className="mb-4 text-center">
          Rezultate pentru: <strong>{query}</strong> ({displayedProducts.length}{" "}
          produse)
        </h3>
      )}

      {/* Products Grid */}
      <div className="row row-cols-2 row-cols-sm-2 row-cols-md-4 g-4">
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
                <svg
                  className="cartProductIcon"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addItem(product);
                    toast.success(
                      `${product.name} a fost adăugat în lista de comandă!`
                    );
                  }}
                  xmlns="http://www.w3.org/2000/svg"
                  width="25"
                  height="25"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="10" cy="20.5" r="1" />
                  <circle cx="18" cy="20.5" r="1" />
                  <path d="M2.5 2.5h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6l1.6-8.4H7.1" />
                </svg>
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
