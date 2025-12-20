package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// --- Structuri request/response ---
type registerReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
	Phone    string `json:"phone"`
}

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type safeUser struct {
	ID    uint   `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

type authResp struct {
	User safeUser `json:"user"`
}

func generateToken() (string, error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// --- Handlers ---
func handleRegister(w http.ResponseWriter, r *http.Request) {
	var req registerReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpError(w, http.StatusBadRequest, "json invalid")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	if !validEmail(req.Email) || len(req.Password) < 6 {
		httpError(w, http.StatusBadRequest, "Email invalid sau parola prea scurtă")
		return
	}

	if strings.TrimSpace(req.Phone) == "" {
		httpError(w, http.StatusBadRequest, "Numărul de telefon este obligatoriu")
		return
	}

	if !regexp.MustCompile(`^\+?[0-9]{8,15}$`).MatchString(req.Phone) {
		httpError(w, http.StatusBadRequest, "Număr de telefon invalid")
		return
	}

	// verificăm dacă email deja există
	var exists User
	if err := DB.Where("email = ?", req.Email).First(&exists).Error; err == nil {
		httpError(w, http.StatusConflict, "Email deja folosit")
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		httpError(w, http.StatusInternalServerError, "Eroare server")
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		httpError(w, http.StatusInternalServerError, "Eroare server")
		return
	}

	token, err := generateToken()
	if err != nil {
		httpError(w, http.StatusInternalServerError, "Eroare server")
		return
	}

	user := User{
		Email:                 req.Email,
		Name:                  req.Name,
		Phone:                 req.Phone,
		PasswordHash:          string(hash),
		IsVerified:            false,
		VerificationToken:     token,
		VerificationExpiresAt: time.Now().Add(24 * time.Hour),
	}

	if err := DB.Create(&user).Error; err != nil {
		httpError(w, http.StatusInternalServerError, "Eroare server")
		return
	}

	// Trimitem e-mail-ul de confirmare
	verifyURL := fmt.Sprintf("%s/api/verify?token=%s", getEnv("APP_BASE_URL", "http://localhost:8080"), token)
	subject := "Confirmă-ți adresa de email"
	body := fmt.Sprintf("Salut %s,\n\nTe rugăm să confirmi contul tău accesând linkul de mai jos:\n\n%s\n\nLinkul expiră în 24 ore.\n\nMulțumim!", user.Name, verifyURL)

	if err := SendEmail(user.Email, subject, body); err != nil {
		// nu opri flow-ul — arată mesaj, dar loghează eroarea
		log.Println("Eroare trimitere email verificare:", err)
	}

	okJSON(w, map[string]string{
		"message": "Cont creat. Verifică email-ul pentru confirmare.",
	})
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httpError(w, http.StatusBadRequest, "JSON invalid")
		return
	}

	log.Println("=== LOGIN ATTEMPT ===")
	log.Println("Email:", req.Email)

	var user User
	if err := DB.Where("email = ?", strings.ToLower(req.Email)).First(&user).Error; err != nil {
		log.Println("❌ User not found:", err)
		httpError(w, http.StatusUnauthorized, "Credențiale invalide")
		return
	}

	log.Println("✅ User found:", user.Email, "ID:", user.ID)

	if !user.IsVerified {
		log.Println("❌ User not verified")
		httpError(w, http.StatusUnauthorized, "Please verify your email before logging in")
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		log.Println("❌ Invalid password")
		httpError(w, http.StatusUnauthorized, "Credențiale invalide")
		return
	}

	token, err := issueToken(user.ID, user.Email)
	if err != nil {
		log.Println("Token generation error:", err)
		httpError(w, http.StatusInternalServerError, "Eroare server")
		return
	}

	log.Println("Login successful, setting authToken cookie for user:", user.Email)

	items, _ := getGuestCart(r)
	if len(items) > 0 {
		mergeGuestCartToUser(w, r, user.ID)
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "authToken",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		MaxAge:   24 * 60 * 60,
	})

	resp := authResp{
		User: safeUser{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
			Phone: user.Phone,
		},
	}

	log.Println("✅ Login response sent")
	okJSON(w, resp)
}

func handleLogout(w http.ResponseWriter, r *http.Request) {
	// șterge cookie-ul
	http.SetCookie(w, &http.Cookie{
		Name:     "authToken",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	})
	okJSON(w, map[string]string{"message": "Logged out"})
}

func handleMe(w http.ResponseWriter, r *http.Request) {
	log.Println("=== HANDLE ME CALLED ===")

	userID, ok := r.Context().Value(userIDKey).(uint)
	if !ok {
		log.Println("❌ handleMe: userID not found in context")
		httpError(w, http.StatusUnauthorized, "userID not found in context")
		return
	}

	log.Println("handleMe: userID from context:", userID)

	var user User
	if err := DB.First(&user, userID).Error; err != nil {
		log.Println("❌ handleMe: user not found in DB:", err)
		httpError(w, http.StatusUnauthorized, "user not found")
		return
	}

	log.Println("✅ handleMe: user found:", user.Email)

	safeUser := map[string]interface{}{
		"id":         user.ID,
		"email":      user.Email,
		"name":       user.Name,
		"phone":      user.Phone,
		"googleId":   user.GoogleID,
		"pictureUrl": user.PictureURL,
	}

	w.Header().Set("Content-Type", "application/json")
	log.Println("=== HANDLE ME SUCCESS ===")
	json.NewEncoder(w).Encode(safeUser)
}

// --- JWT ---
func issueToken(userID uint, email string) (string, error) {
	claims := jwt.MapClaims{
		"sub":   userID,
		"email": email,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		panic("JWT_SECRET not set")
	}
	return token.SignedString([]byte(secret))
}

// --- Middleware ---
func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Println("Request URL:", r.URL.Path)
		log.Println("Request Method:", r.Method)

		// Log all cookies for debugging
		for _, cookie := range r.Cookies() {
			log.Printf("Cookie: %s = %s\n", cookie.Name, cookie.Value)
		}

		// Încearcă să citești token-ul din cookie
		cookie, err := r.Cookie("authToken")
		if err != nil {
			log.Println("ℹ️ No authToken cookie found - anonymous user")
			// NU returna eroare, doar treci mai departe fără userID
			next.ServeHTTP(w, r)
			return
		}

		log.Println("✅ Found authToken cookie")
		tokenStr := cookie.Value
		log.Println("Token length:", len(tokenStr))

		if tokenStr == "" {
			log.Println("ℹ️ authToken is empty - anonymous user")
			next.ServeHTTP(w, r)
			return
		}

		// Parsează token-ul
		tkn, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if token.Method != jwt.SigningMethodHS256 {
				log.Println("❌ Unexpected signing method:", token.Method)
				return nil, errors.New("metodă de semnare neașteptată")
			}
			secret := os.Getenv("JWT_SECRET")
			if secret == "" {
				return nil, errors.New("JWT_SECRET not set")
			}
			return []byte(secret), nil
		})

		if err != nil {
			log.Println("❌ Token parsing error:", err)
			// Șterge cookie-ul invalid
			http.SetCookie(w, &http.Cookie{
				Name:     "authToken",
				Value:    "",
				Path:     "/",
				MaxAge:   -1,
				HttpOnly: true,
				Secure:   true,
				SameSite: http.SameSiteNoneMode,
			})
			next.ServeHTTP(w, r)
			return
		}

		if !tkn.Valid {
			log.Println("❌ Token invalid")
			// Șterge cookie-ul invalid
			http.SetCookie(w, &http.Cookie{
				Name:     "authToken",
				Value:    "",
				Path:     "/",
				MaxAge:   -1,
				HttpOnly: true,
				Secure:   true,
				SameSite: http.SameSiteNoneMode,
			})
			next.ServeHTTP(w, r)
			return
		}

		claims, ok := tkn.Claims.(jwt.MapClaims)
		if !ok {
			log.Println("❌ Invalid token claims")
			next.ServeHTTP(w, r)
			return
		}

		log.Println("✅ Token claims:", claims)

		idFloat, ok := claims["sub"].(float64)
		if !ok {
			log.Println("❌ Invalid sub claim in token")
			next.ServeHTTP(w, r)
			return
		}

		userID := uint(idFloat)
		log.Println("✅ User authenticated, ID:", userID)

		// Adaugă userID-ul în context
		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value(userIDKey).(uint)
		if !ok || userID == 0 {
			log.Println("🚫 Access denied - authentication required for:", r.URL.Path)
			httpError(w, http.StatusUnauthorized, "Autentificare necesară")
			return
		}
		log.Printf("✅ User %d accessing protected route: %s", userID, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

// --- Helpers ---
func okJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func httpError(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

func validEmail(s string) bool {
	return strings.Contains(s, "@") && strings.Contains(s, ".") && len(s) <= 255
}

func getEnv(key, fallback string) string {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return fallback
	}
	return v
}
