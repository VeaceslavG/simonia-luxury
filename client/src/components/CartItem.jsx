// import { useCart } from "../context/CartContext";

// export default function CartItem({ product }) {
//   const { updateQuantity, removeFromCart } = useCart();

//   return (
//     <div className="list-group-item d-flex justify-content-between align-items-center">
//       <div className="d-flex align-items-center gap-3">
//         <img src={product.image} alt={product.name} width={60} />
//         <div>
//           <h5>{product.name}</h5>
//           <p>{product.price} MDL</p>
//         </div>
//       </div>
//       <div className="d-flex align-items-center gap-2">
//         <input
//           type="number"
//           min="1"
//           value={product.quantity}
//           onChange={(e) => updateQuantity(product.id, Number(e.target.value))}
//           className="form-control form-control-sm"
//           style={{ width: "60px" }}
//         />
//         <button
//           className="btn btn-outline-danger btn-sm"
//           onClick={() => removeFromCart(product.id)}
//         >
//           Șterge
//         </button>
//       </div>
//     </div>
//   );
// }
