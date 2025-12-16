package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

var googleOAuthConfig *oauth2.Config

func init() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}

	initGoogleOAuth()
}

func initGoogleOAuth() {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	redirectURL := os.Getenv("GOOGLE_REDIRECT_URL")

	log.Printf("ClientID: %s", maskString(clientID))
	log.Printf("ClientSecret: %s", maskString(clientSecret))
	log.Printf("RedirectURL: %s", redirectURL)

	if clientID == "" || clientSecret == "" || redirectURL == "" {
		log.Fatal(`
Missing required Google OAuth environment variables!
Please set:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET  
- GOOGLE_REDIRECT_URL

You can set them in:
1. .env file in project root
2. System environment variables
3. Docker environment variables
`)
	}

	googleOAuthConfig = &oauth2.Config{
		RedirectURL:  redirectURL,
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
			"https://www.googleapis.com/auth/user.phonenumbers.read",
		},
		Endpoint: google.Endpoint,
	}
	log.Println("Google OAuth configured successfully")
}

func maskString(s string) string {
	if len(s) <= 8 {
		return "***"
	}
	return s[:4] + "***" + s[len(s)-4:]
}

func randomString(length int) string {
	b := make([]byte, length)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)[:length]
}

func generateStateOauthCookie(w http.ResponseWriter) string {
	state := "random-state-string-" + randomString(16)

	http.SetCookie(w, &http.Cookie{
		Name:     "oauthstate",
		Value:    state,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
		MaxAge:   60 * 10,
	})

	return state
}

// Funcție helper pentru a obține numărul de telefon
func getGooglePhoneNumber(client *http.Client) (string, error) {
	resp, err := client.Get("https://people.googleapis.com/v1/people/me?personFields=phoneNumbers,emailAddresses,names")
	if err != nil {
		log.Printf("❌ Error making request to People API: %v", err)
		return "", err
	}
	defer resp.Body.Close()

	// Log the raw response for debugging
	bodyBytes, _ := io.ReadAll(resp.Body)
	log.Printf("🔍 People API RAW Response: %s", string(bodyBytes))

	// Reset the response body so we can decode it again
	resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var peopleResponse struct {
		PhoneNumbers []struct {
			Value string `json:"value"`
			Type  string `json:"type"`
		} `json:"phoneNumbers"`
		EmailAddresses []struct {
			Value string `json:"value"`
		} `json:"emailAddresses"`
		Names []struct {
			DisplayName string `json:"displayName"`
		} `json:"names"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&peopleResponse); err != nil {
		log.Printf("❌ Error decoding People API response: %v", err)
		return "", err
	}

	log.Printf("📞 Found %d phone numbers", len(peopleResponse.PhoneNumbers))
	for i, phone := range peopleResponse.PhoneNumbers {
		log.Printf("  Phone %d: %s (type: %s)", i+1, phone.Value, phone.Type)
	}

	log.Printf("📧 Found %d email addresses", len(peopleResponse.EmailAddresses))
	log.Printf("👤 Found %d names", len(peopleResponse.Names))

	if len(peopleResponse.PhoneNumbers) > 0 {
		phone := peopleResponse.PhoneNumbers[0].Value
		log.Printf("✅ Using phone number: %s", phone)
		return phone, nil
	}

	log.Printf("❌ No phone numbers found in Google account")
	return "", errors.New("no phone number found")
}

// redirect user to google login
func handleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	if googleOAuthConfig == nil {
		httpError(w, http.StatusInternalServerError, "OAuth not configured")
		return
	}

	state := generateStateOauthCookie(w)

	log.Printf("🔑 OAuth Scopes: %v", googleOAuthConfig.Scopes)

	url := googleOAuthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// google redirects back to this endpoint
func handleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	state := r.URL.Query().Get("state")
	cookie, err := r.Cookie("oauthstate")

	if err != nil || state != cookie.Value {
		httpError(w, http.StatusBadRequest, "Invalid state parameter")
		return
	}

	code := r.URL.Query().Get("code")
	if code == "" {
		httpError(w, http.StatusBadRequest, "Missing authorization code")
		return
	}

	token, err := googleOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		if strings.Contains(err.Error(), "access_denied") {
			httpError(w, http.StatusUnauthorized, "Access denied: email not authorized")
			return
		}
		httpError(w, http.StatusInternalServerError, "Token exchange failed: "+err.Error())
		return
	}

	// Get user info from Google
	client := googleOAuthConfig.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		httpError(w, http.StatusInternalServerError, "Failed to get user info: "+err.Error())
		return
	}
	defer resp.Body.Close()

	var gUser struct {
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
		Id      string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&gUser); err != nil {
		httpError(w, http.StatusInternalServerError, "Failed to decode user info: "+err.Error())
		return
	}

	phoneNumber, err := getGooglePhoneNumber(client)
	if err != nil {
		log.Printf("Could not get phone number: %v", err)
	}

	// DB LOGIC
	var user User
	if err := DB.Where("email = ?", gUser.Email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// user not found -> create
			user = User{
				Email:      gUser.Email,
				Name:       gUser.Name,
				IsVerified: true,
				GoogleID:   gUser.Id,
				PictureURL: gUser.Picture,
				Phone:      phoneNumber,
			}
			if user.Phone == "" {
				log.Printf("ℹ️ No phone number from Google, will ask user later")
			}
			if err := DB.Create(&user).Error; err != nil {
				httpError(w, http.StatusInternalServerError, "DB error: "+err.Error())
				return
			}
		} else {
			httpError(w, http.StatusInternalServerError, "DB query error: "+err.Error())
			return
		}
	} else {
		if user.GoogleID == "" {
			user.GoogleID = gUser.Id
			user.PictureURL = gUser.Picture
			if user.Phone == "" && phoneNumber != "" {
				user.Phone = phoneNumber
			}
			DB.Save(&user)
		}
	}

	// issue our JWT
	jwtToken, err := issueToken(user.ID, user.Email)
	if err != nil {
		httpError(w, http.StatusInternalServerError, "Token issue failed")
		return
	}
	// send JWT to frontend (cookie)
	http.SetCookie(w, &http.Cookie{
		Name:     "authToken",
		Value:    jwtToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	})
	frontendURL := getEnv("FRONTEND_URL", "http://localhost:5173")
	http.Redirect(w, r, frontendURL+"/account", http.StatusSeeOther)
}
