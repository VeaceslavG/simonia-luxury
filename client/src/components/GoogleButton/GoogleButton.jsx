import googleIcon from "../../assets/auth/google.png";
import "./googleButton.scss";

export default function GoogleButton() {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/api/auth/google/login";
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
