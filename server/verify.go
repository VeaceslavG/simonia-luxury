// handlers/verify.go
package main

import (
	"net/http"
)

func handleVerify(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		httpError(w, http.StatusBadRequest, "Token missing")
		return
	}

	var user User
	if err := DB.Where("verification_token = ?", token).First(&user).Error; err != nil {
		httpError(w, http.StatusBadRequest, "Invalid or expired token")
		return
	}

	user.IsVerified = true
	user.VerificationToken = ""
	if err := DB.Save(&user).Error; err != nil {
		httpError(w, http.StatusInternalServerError, "Could not verify email")
		return
	}

	// Poți redirecta la o pagină frontend
	// http.Redirect(w, r, "http://localhost:5173/confirmed", http.StatusSeeOther)
	okJSON(w, map[string]string{"message": "Email confirmed successfully! You can now log in."})
}
