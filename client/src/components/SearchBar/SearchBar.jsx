import { useState } from "react";
import "./searchBar.scss";

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  function handleInputChange(e) {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (onSearch) {
      onSearch(newQuery);
    }
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Caută..."
      />
    </div>
  );
}
