import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TabButton from "../TabButton";
import { productsData } from "./productsData";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./products.scss";

export default function Products({ cartIcon, selectedCategory }) {
  const [activeCategory, setActiveCategory] = useState("canapele");
  const { addItem } = useCart();

  useEffect(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
    } else {
      setActiveCategory("canapele");
    }
  }, [selectedCategory]);

  function handleFilter(category) {
    setActiveCategory(category);
  }

  const filteredProducts = productsData.filter(
    (product) => product.category.toLowerCase() === activeCategory
  );

  return (
    <div id="products" className="container productsContainer">
      {/* Tabs menu */}
      <menu className="category-menu text-center mb-5">
        <TabButton
          isSelected={activeCategory === "canapele"}
          onClick={() => handleFilter("canapele")}
        >
          Canapele
        </TabButton>
        <TabButton
          isSelected={activeCategory === "coltare"}
          onClick={() => handleFilter("coltare")}
        >
          Colțare
        </TabButton>
        <TabButton
          isSelected={activeCategory === "fotolii"}
          onClick={() => handleFilter("fotolii")}
        >
          Fotolii
        </TabButton>
        <TabButton
          isSelected={activeCategory === "paturi"}
          onClick={() => handleFilter("paturi")}
        >
          Paturi
        </TabButton>
      </menu>

      {/* Products Grid */}
      <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-4">
        {filteredProducts.map((product) => (
          <Link to={`/product/${product.id}`} key={product.id}>
            <div className="card h-100 productCard">
              <div className="viewProduct position-relative">
                <img
                  className="card-img-top productImage"
                  src={product.image}
                  alt={product.name}
                />
                <img
                  className="cartProductIcon"
                  src={cartIcon}
                  alt=""
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addItem(product);
                    toast.success(`${product.name} a fost adăugat în coș!`);
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
