import { useState } from "react";
import { toast } from "react-toastify";
import ReactDOM from "react-dom";
import "react-toastify/dist/ReactToastify.css";
import "./orderModal.scss";
import { API_URL } from "../../config/api";
import { handleBlur } from "../../components/Utils/formHandlers";

export default function OrderModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Comandă sau informează-te</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <input
              id="name"
              name="name"
              placeholder="Nume"
              type="text"
              className="input"
              required
              pattern="[A-Za-z ]{3,16}$"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <span className="inputFormErrMessage">Numele trebuie să aibă 3-16 caractere și să nu includă niciun caracter special!</span>
          </div>
          <div>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Telefon"
              className="input"
              required
              pattern="^\+?[0-9]{8,15}$"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <span className="inputFormErrMessage">Introduceți un număr de telefon valid (8-15 cifre, opțional + la început)!</span>
          </div>
          <div>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="E-mail"
              className="input"
              required
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            <span className="inputFormErrMessage">Introduceți o adresă de e-mail validă (ex: name@example.com)!</span>
          </div>
          <div>
            <textarea
              name="notes"
              placeholder="Observații"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Se trimite..." : "Trimite"}
          </button>
        </form>
        <button onClick={onClose}>Închide</button>
      </div>
    </div>,
    document.body
  );
}
