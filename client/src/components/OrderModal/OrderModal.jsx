import { useState } from "react";
import { toast } from "react-toastify";
import ReactDOM from "react-dom";
import "react-toastify/dist/ReactToastify.css";
import "./orderModal.scss";
import { API_URL } from "../../config/api";

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
      const orderData = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: "",
        city: "",
        notes: formData.notes,
        items: [],
      };

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
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

  return ReactDOM.createPortal(
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
    </div>,
    document.body
  );
}
