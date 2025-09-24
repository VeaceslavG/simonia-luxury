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
	User  safeUser `json:"user"`
	Token string   `json:"token"`
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
		Email:             req.Email,
		Name:              req.Name,
		Phone:             req.Phone,
		PasswordHash:      string(hash),
		IsVerified:        false,
		VerificationToken: token,
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

	var user User
	if err := DB.Where("email = ?", strings.ToLower(req.Email)).First(&user).Error; err != nil {
		httpError(w, http.StatusUnauthorized, "Credențiale invalide")
		return
	}

	if !user.IsVerified {
		httpError(w, http.StatusUnauthorized, "Please verify your email before logging in")
		return
	}

	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		httpError(w, http.StatusUnauthorized, "Credențiale invalide")
		return
	}

	token, err := issueToken(user.ID, user.Email)
	if err != nil {
		httpError(w, http.StatusInternalServerError, "Eroare server")
		return
	}

	resp := authResp{
		User: safeUser{
			ID:    user.ID,
			Email: user.Email,
			Name:  user.Name,
			Phone: user.Phone,
		},
		Token: token,
	}
	okJSON(w, resp)
}

func handleMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(userIDKey).(uint)
	if !ok {
		httpError(w, http.StatusUnauthorized, "token invalid")
		return
	}

	var user User
	if err := DB.First(&user, userID).Error; err != nil {
		httpError(w, http.StatusUnauthorized, "user not found")
		return
	}

	json.NewEncoder(w).Encode(user)
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
	return token.SignedString([]byte(secret))
}

// --- Middleware ---
func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		bearer := r.Header.Get("Authorization")
		if bearer == "" || !strings.HasPrefix(bearer, "Bearer ") {
			httpError(w, http.StatusUnauthorized, "Token lipsă")
			return
		}

		tokenStr := strings.TrimPrefix(bearer, "Bearer ")
		tkn, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, errors.New("metodă de semnare neașteptată")
			}
			return []byte(getEnv("JWT_SECRET", "supersecret")), nil
		})

		if err != nil || !tkn.Valid {
			httpError(w, http.StatusUnauthorized, "token invalid")
			return
		}

		claims := tkn.Claims.(jwt.MapClaims)
		idFloat, ok := claims["sub"].(float64)
		if !ok {
			httpError(w, http.StatusUnauthorized, "token invalid")
			return
		}
		userID := uint(idFloat)

		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
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
