import { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./orderModal.scss";

export default function OrderModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData), // doar datele introduse în formular
      });

      if (response.ok) {
        toast.success("Comanda a fost trimisă cu succes!");
        setFormData({ name: "", phone: "", email: "", notes: "" });
        onClose();
      } else {
        const errorText = await response.text();
        toast.error(`Eroare la trimiterea comenzii: ${errorText}`);
      }
    } catch (err) {
      toast.error("Eroare de rețea.");
      console.error(err);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Comandă sau informează-te</h2>
        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Nume"
            required
            value={formData.name}
            onChange={handleChange}
          />
          <input
            name="phone"
            placeholder="Telefon"
            required
            value={formData.phone}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="E-mail"
            required
            value={formData.email}
            onChange={handleChange}
          />
          <textarea
            name="notes"
            placeholder="Observații"
            value={formData.notes}
            onChange={handleChange}
          />
          <button type="submit">Trimite</button>
        </form>
        <button onClick={onClose}>Închide</button>
      </div>
    </div>
  );
}
