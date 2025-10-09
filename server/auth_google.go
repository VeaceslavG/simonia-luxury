package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

var googleOAuthConfig = &oauth2.Config{
	RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
	ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
	ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
	Scopes: []string{
		"https://www.googleapis.com/auth/userinfo.email",
		"https://www.googleapis.com/auth/userinfo.profile",
	},
	Endpoint: google.Endpoint,
}

// redirect user to google login
func handleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	url := googleOAuthConfig.AuthCodeURL("random-state-string", oauth2.AccessTypeOffline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

// google redirects back to this endpoint
func handleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		httpError(w, http.StatusBadRequest, "Missing code")
		return
	}

	token, err := googleOAuthConfig.Exchange(context.Background(), code)
	if err != nil {
		// aici prindem eroarea de Access blocked sau alte erori OAuth
		if strings.Contains(err.Error(), "access_denied") {
			httpError(w, http.StatusUnauthorized, "Access blocked: email not authorized for this app (not a test user?)")
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
			}
			if err := DB.Create(&user).Error; err != nil {
				httpError(w, http.StatusInternalServerError, "DB error: "+err.Error())
				return
			}
		} else {
			httpError(w, http.StatusInternalServerError, "DB query error: "+err.Error())
			return
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
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})
	userID := user.ID
	mergeGuestCartToUser(w, r, userID)
	// trimite doar redirect fără token în URL
	frontendURL := getEnv("FRONTEND_URL", "http://localhost:5173")
	http.Redirect(w, r, frontendURL+"/account", http.StatusSeeOther)

}
