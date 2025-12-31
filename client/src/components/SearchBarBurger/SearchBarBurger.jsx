// SearchBarBurger.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./searchBarBurger.scss";

export default function SearchBarBurger() {
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
    <div className="search-bar-burger-wrapper">
      <form onSubmit={handleSearch} className="search-bar-burger">
        <input
          className="searchInput-burger"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Caută..."
        />
        <button type="submit" className="submit-burger">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#000"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </form>
    </div>
  );
}
