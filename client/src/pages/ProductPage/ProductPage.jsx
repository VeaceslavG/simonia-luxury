import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import { Helmet } from "react-helmet-async";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "./productPage.scss";

import Nav from "../../components/Nav/Nav";
import Footer from "../../components/Footer/Footer";
import defaultImage from "../../assets/default_image.png";

import { API_URL } from "../../config/api";

export default function ProductPage() {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const { slug } = useParams();
  const id = slug?.split("-").pop();

  useEffect(() => {
    async function fetchProduct() {
      if (!id) {
        setLoading(false);
        setProduct(null);
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/products/${id}`);
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

  const getMainImageUrl = (product) => {
    if (!product || !product.image_urls) {
      return defaultImage;
    }
    let imageArray = [];
    if (typeof product.image_urls === "string") {
      imageArray = product.image_urls.split(",").filter((url) => url.trim());
    } else if (Array.isArray(product.image_urls)) {
      imageArray = product.image_urls.filter((url) => url);
    }

    const firstImage = imageArray[0]?.trim();
    if (firstImage) {
      if (String(firstImage).startsWith("http")) {
        return firstImage;
      }

      const cleanPath = firstImage.startsWith("/")
        ? firstImage
        : `/${firstImage}`;

      return `${API_URL}${cleanPath}`;
    }

    return defaultImage;
  };

  if (loading) return <div className="text-center py-5">Se încarcă...</div>;
  if (!product)
    return <div className="text-center py-5">Produsul nu a fost găsit</div>;

  function decreaseQuantity() {
    if (quantity > 1) setQuantity(quantity - 1);
  }
  function increaseQuantity() {
    setQuantity(quantity + 1);
  }

  const displayedImage = getMainImageUrl(product);

  return (
    <>
      <Nav />
      <Helmet>
        <title>{product.name} | Mobilă la comandă Simonia Luxury</title>

        <meta
          name="description"
          content={
            product.description
              ? product.description.slice(0, 155)
              : `Comandă ${product.name} realizată la comandă. Mobilă moale de lux, calitate premium, livrare în Moldova.`
          }
        />

        <link
          rel="canonical"
          href={`https://www.simonialuxury.com/product/${slug}`}
        />

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: [displayedImage],
            description:
              product.description ||
              "Mobilă moale de lux realizată la comandă.",
            brand: {
              "@type": "Brand",
              name: "Simonia Luxury",
            },
            offers: {
              "@type": "Offer",
              priceCurrency: "MDL",
              price: ((product.price_cents ?? 0) / 100).toFixed(2),
              availability: "https://schema.org/InStock",
              url: `https://www.simonialuxury.com/product/${id}`,
            },
          })}
        </script>

        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Acasă",
                item: "https://www.simonialuxury.com",
              },
              {
                "@type": "ListItem",
                position: 2,
                name: product?.category?.name
                  ? product.category.name.charAt(0).toUpperCase() +
                    product.category.name.slice(1)
                  : "Produse",
                item: "https://www.simonialuxury.com/product",
              },
              {
                "@type": "ListItem",
                position: 3,
                name: product.name,
                item: `https://www.simonialuxury.com/product/${slug}`,
              },
            ],
          })}
        </script>
      </Helmet>
      <nav className="breadcrumbs mb-3">
        <Link to="/">Acasă</Link> &gt;{" "}
        <span>
          {product?.category?.name
            ? product.category.name.charAt(0).toUpperCase() +
              product.category.name.slice(1)
            : "Produse"}
        </span>{" "}
        &gt; <span>{product.name}</span>
      </nav>
      <div className="container productPage">
        <div className="row g-4">
          <div className="col-md-6">
            <img
              src={displayedImage}
              alt={product.name}
              className="img-fluid shadow productImage"
              onError={(e) => {
                e.target.src = defaultImage;
              }}
            />
          </div>

          <div className="col-md-6 d-flex flex-column justify-content-center">
            <h1 className="productName mb-3">{product.name}</h1>
            <p className="productPrice mb-3">
              {((product.price_cents ?? 0) / 100).toFixed(2)} MDL
            </p>
            <div className="productDescription">
              <p>{product.description}</p>
              <p>
                Acest produs este realizat la comandă de echipa Simonia Luxury,
                folosind materiale premium și finisaje de calitate superioară.
              </p>
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
                addItem({ ...product }, quantity);
                toast.success(
                  `${product.name} a fost adăugat în lista de comandă!`
                );
              }}
            >
              Comandă un model similar
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
