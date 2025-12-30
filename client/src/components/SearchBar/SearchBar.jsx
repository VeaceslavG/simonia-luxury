import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./searchBar.scss";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      toast.error("Te rugăm să introduci un termen de căutare.", {
        className: "custom-toast",
        bodyClassName: "custom-toast-body",
        progressClassName: "custom-toast-progress",
        position: "top-center",
        autoClose: 2000,
      });
      return;
    }

    navigate(`/search-results?query=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="search-bar-wrapper">
      <form onSubmit={handleSearch} className="search-bar">
        <input
          className="searchInput"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Caută..."
        />
        <button type="submit">Caută</button>
      </form>
    </div>
  );
}
