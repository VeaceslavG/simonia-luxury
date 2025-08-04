import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TabButton from "../TabButton";
import { productsData } from "./productsData";
import "./products.scss";

export default function Products({ cartIcon, selectedCategory }) {
  const [activeCategory, setActiveCategory] = useState("canapele");

  useEffect(() => {
    console.log("Categoria selectată:", selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    // Actualizăm doar dacă avem o categorie selectată explicit
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
    } else {
      // Forcează "canapele" când nu avem selecție
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
            <div className="col">
              <div className="card h-100 productCard">
                <div className="viewProduct">
                  <img
                    className="card-img-top productImage"
                    src={product.image}
                    alt={product.name}
                  />
                  <img className="cartProductIcon" src={cartIcon} alt="" />
                </div>
                <div className="card-body">
                  <span className="card-title productName">{product.name}</span>
                  <span className="card-text productPrice">
                    {product.price}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
