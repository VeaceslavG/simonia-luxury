import { useState } from "react";
import { Link } from "react-router-dom";
import TabButton from "../TabButton";
import { productsData } from "./productsData";
import "./products.scss";

export default function Products({ cartIcon }) {
  const [selectedCategory, setSelectedCategory] = useState("canapele");

  function handleFilter(category) {
    setSelectedCategory(category);
  }

  let productContent;

  if (selectedCategory) {
    const filteredProducts = productsData.filter(
      (product) => product.category === selectedCategory
    );

    productContent = (
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
    );
  }

  return (
    <div className="container productsContainer">
      {/* Tabs menu */}
      <menu className="category-menu text-center mb-5">
        <TabButton
          isSelected={selectedCategory === "canapele"}
          onClick={() => handleFilter("canapele")}
          className="category-btn"
        >
          Canapele
        </TabButton>
        <TabButton
          isSelected={selectedCategory === "coltare"}
          onClick={() => handleFilter("coltare")}
          className="category-btn"
        >
          Colțare
        </TabButton>
        <TabButton
          isSelected={selectedCategory === "fotolii"}
          onClick={() => handleFilter("fotolii")}
          className="category-btn"
        >
          Fotolii
        </TabButton>
        <TabButton
          isSelected={selectedCategory === "paturi"}
          onClick={() => handleFilter("paturi")}
          className="category-btn"
        >
          Paturi
        </TabButton>
      </menu>

      {productContent}
    </div>
  );
}
