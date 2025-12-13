import googleIcon from "../../assets/auth/google.png";
import "./googleButton.scss";
import { API_URL } from "../../config/api";

export default function GoogleButton() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google/login`;
  };

  return (
    <button className="googleBtn" onClick={handleGoogleLogin}>
      <img
        src={googleIcon}
        alt="Google logo"
        style={{ width: "20px", height: "20px" }}
      />
      Continue with Google
    </button>
  );
}
