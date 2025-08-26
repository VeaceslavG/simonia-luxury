import { useLocation } from "react-router-dom";
import "./searchResults.scss";
import Products from "../Products/Products";
import Nav from "../Nav/Nav";
import Footer from "../Footer/Footer";

export default function SearchResults() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get("query") || "";

  return (
    <>
      <Nav />
      <main className="searchResultsMain">
        <Products selectedCategory="" searchQuery={query} />
      </main>
      <Footer />
    </>
  );
}
