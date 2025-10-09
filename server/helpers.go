package main

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"
)

// În backend - funcții pentru guest cart
type GuestCartItem struct {
	ProductID uint `json:"productId"`
	Quantity  int  `json:"quantity"`
}

func getGuestCart(r *http.Request) ([]GuestCartItem, error) {
	cookie, err := r.Cookie("guestCart")
	if err != nil {
		log.Println("ℹ️ No guestCart cookie found")
		return []GuestCartItem{}, nil
	}

	log.Println("📦 guestCart cookie raw value:", cookie.Value)

	// Decode URL encoding
	decodedValue, err := url.QueryUnescape(cookie.Value)
	if err != nil {
		log.Println("❌ Error URL decoding guestCart cookie:", err)
		return []GuestCartItem{}, err
	}

	log.Println("📦 guestCart cookie decoded value:", decodedValue)

	var items []GuestCartItem
	if err := json.Unmarshal([]byte(decodedValue), &items); err != nil {
		log.Println("❌ Error parsing guestCart cookie as JSON:", err)
		return []GuestCartItem{}, err
	}

	log.Printf("📦 Parsed %d guest cart items", len(items))
	for i, item := range items {
		log.Printf("  Item %d: ProductID=%d, Quantity=%d", i, item.ProductID, item.Quantity)
	}

	return items, nil
}
func saveGuestCart(w http.ResponseWriter, items []GuestCartItem) {
	jsonData, err := json.Marshal(items)
	if err != nil {
		log.Println("❌ Error marshaling guest cart:", err)
		return
	}

	// NU mai face URL encoding aici - frontend-ul deja face
	cookieValue := string(jsonData)
	log.Println("💾 Saving guest cart (no encoding):", cookieValue)

	http.SetCookie(w, &http.Cookie{
		Name:     "guestCart",
		Value:    cookieValue,
		Path:     "/",
		MaxAge:   30 * 24 * 3600,
		HttpOnly: false,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	})
}
