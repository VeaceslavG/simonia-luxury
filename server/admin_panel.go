package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
)

// admin login
type AdminCredentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AdminClaims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

var adminJWTKey = []byte("JWT_SECRET_ADMIN")

func adminLogin(w http.ResponseWriter, r *http.Request) {
	var creds AdminCredentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	adminUser := getEnv("ADMIN_USER", "admin")
	adminPass := getEnv("ADMIN_PASS", "password123")

	if creds.Username != adminUser || creds.Password != adminPass {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Generează JWT pentru admin
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &AdminClaims{
		Username: creds.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(adminJWTKey)
	if err != nil {
		http.Error(w, "Token generation failed", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "admin_token",
		Value:    tokenString,
		Expires:  expirationTime,
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	json.NewEncoder(w).Encode(map[string]string{
		"token": tokenString,
	})
}

func adminLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "admin_token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HttpOnly: true,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Logged out successfully",
	})
}

// Middleware care validează doar admin_token
func adminAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Println("ADMIN AUTH MIDDLEWARE")
		log.Println("Request:", r.Method, r.URL.Path)

		var tokenString string

		authHeader := r.Header.Get("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			tokenString = strings.TrimSpace(tokenString)
			log.Println("Found Bearer token in header:", tokenString[:10]+"...")
		} else {
			cookie, err := r.Cookie("admin_token")
			if err == nil && cookie.Value != "" {
				tokenString = cookie.Value
				log.Println("Found admin_token in cookie")
			}
		}

		if tokenString == "" {
			log.Println("No admin token found in header or cookie")
			http.Error(w, "Unauthorized - No token", http.StatusUnauthorized)
			return
		}

		claims := &AdminClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return adminJWTKey, nil
		})

		if err != nil {
			log.Println("Token validation error:", err)
			http.Error(w, "Unauthorized - Invalid token", http.StatusUnauthorized)
			return
		}

		if !token.Valid {
			log.Println("Token is invalid")
			http.Error(w, "Unauthorized - Token invalid", http.StatusUnauthorized)
			return
		}

		log.Println("Admin authentificated:", claims.Username)
		next.ServeHTTP(w, r)
	})
}

func adminMe(w http.ResponseWriter, r *http.Request) {
	log.Println("ADMIN ME ENDPOINT")

	var tokenString string

	authHeader := r.Header.Get("Authorization")
	if authHeader != "" && strings.HasPrefix(authHeader, "Bearer") {
		tokenString = strings.TrimPrefix(authHeader, "Bearer")
		tokenString = strings.TrimSpace(tokenString)
		log.Println("Using token from Authorization header")
	} else {
		// Cookie fallback
		cookie, err := r.Cookie("admin_token")
		if err != nil {
			log.Println("No token found in header or cookie")
			http.Error(w, "Unauthorized - No token", http.StatusUnauthorized)
			return
		}

		tokenString = cookie.Value
		log.Println("Using token from cookie")
	}

	claims := &AdminClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return adminJWTKey, nil
	})

	if err != nil || !token.Valid {
		log.Println("Token validation failed:", err)
		http.Error(w, "Unauthorized - Invalid token", http.StatusUnauthorized)
		return
	}

	log.Println("Admin me successful:", claims.Username)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"username": claims.Username,
		"role":     "admin",
		"id":       1,
	})
}

// Funcție pentru a obține toți utilizatorii (admin)
func getAdminUsers(w http.ResponseWriter, r *http.Request) {
	var users []User
	var total int64

	// Get query parameters
	query := r.URL.Query()

	// Parse range [start, end]
	rangeHeader := query.Get("range")
	var start, end int
	if rangeHeader != "" {
		var rangeArr []int
		if err := json.Unmarshal([]byte(rangeHeader), &rangeArr); err == nil && len(rangeArr) == 2 {
			start, end = rangeArr[0], rangeArr[1]
		}
	}

	// Default pagination
	if end == 0 {
		start, end = 0, 9
	}
	pageSize := end - start + 1

	// Get total count
	DB.Model(&User{}).Count(&total)

	// Apply pagination
	offset := start
	limit := pageSize

	// Execute query
	if err := DB.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		http.Error(w, "Eroare la preluarea utilizatorilor", http.StatusInternalServerError)
		return
	}

	// Set headers for React Admin
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Range")
	w.Header().Set("Content-Range", fmt.Sprintf("users %d-%d/%d", start, end, total))

	// Return data
	json.NewEncoder(w).Encode(users)
}

func getAdminProducts(w http.ResponseWriter, r *http.Request) {
	var products []Product
	var total int64

	// Get query parameters
	query := r.URL.Query()

	// Pagination
	rangeHeader := query.Get("range")
	sortHeader := query.Get("sort")
	// filterHeader := query.Get("filter")

	// Parse range [start, end]
	var start, end int
	if rangeHeader != "" {
		var rangeArr []int
		if err := json.Unmarshal([]byte(rangeHeader), &rangeArr); err == nil && len(rangeArr) == 2 {
			start, end = rangeArr[0], rangeArr[1]
		}
	}

	// Default pagination
	if end == 0 {
		start, end = 0, 9 // Default range
	}
	pageSize := end - start + 1

	// Get total count
	DB.Model(&Product{}).Count(&total)

	// Apply pagination
	offset := start
	limit := pageSize

	// Apply sorting
	sortField := "id"
	sortOrder := "ASC"
	if sortHeader != "" {
		var sortArr []string
		if err := json.Unmarshal([]byte(sortHeader), &sortArr); err == nil && len(sortArr) == 2 {
			sortField = sortArr[0]
			sortOrder = sortArr[1]
		}
	}

	// Execute query
	if err := DB.Order(sortField + " " + sortOrder).Offset(offset).Limit(limit).Find(&products).Error; err != nil {
		http.Error(w, "Eroare la preluarea produselor", http.StatusInternalServerError)
		return
	}

	// Set headers for React Admin
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Range")
	w.Header().Set("Content-Range", fmt.Sprintf("products %d-%d/%d", start, end, total))

	// Return data in React Admin format
	json.NewEncoder(w).Encode(products)
}

func getAdminProduct(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var product Product
	if err := DB.First(&product, id).Error; err != nil {
		http.Error(w, "Produsul nu a fost găsit", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func createAdminProduct(w http.ResponseWriter, r *http.Request) {
	var product Product

	if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
		http.Error(w, "Date invalide", http.StatusBadRequest)
		return
	}

	if product.Name == "" {
		http.Error(w, "Numele produsului este obligatoriu", http.StatusBadRequest)
		return
	}

	if product.Price <= 0 {
		http.Error(w, "Pretul trebuie sa fie mai mare decat 0", http.StatusBadRequest)
		return
	}

	if product.IsAvailable == false && product.IsAvailable != true {
		product.IsAvailable = true
	}
	if product.IsActive == false && product.IsActive != true {
		product.IsActive = true
	}

	if err := DB.Create(&product).Error; err != nil {
		http.Error(w, "Eroare la creare", http.StatusInternalServerError)
		return
	}

	DB.Preload("Category").First(&product, product.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func updateProduct(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var product Product
	if err := DB.First(&product, id).Error; err != nil {
		http.Error(w, "Produsul nu a fost găsit", http.StatusNotFound)
		return
	}
	var updateData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		http.Error(w, "Date invalide", http.StatusBadRequest)
		return
	}

	if price, exists := updateData["price"]; exists {
		if priceFloat, ok := price.(float64); ok && priceFloat <= 0 {
			http.Error(w, "Pretul trebuie sa fie mai mare decat 0", http.StatusBadRequest)
			return
		}
	}

	if err := DB.Model(&product).Updates(updateData).Error; err != nil {
		http.Error(w, "Eroare la actualizare", http.StatusInternalServerError)
		return
	}

	DB.Preload("Category").First(&product, product.ID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func updateOrder(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	var order Order

	if err := DB.First(&order, id).Error; err != nil {
		http.Error(w, "Comanda nu a fost gasita", http.StatusNotFound)
		return
	}

	var updateData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		http.Error(w, "Date ivalide", http.StatusBadRequest)
		return
	}

	allowedFields := []string{"status", "name", "phone", "email", "address", "city", "notes"}
	updateMap := make(map[string]interface{})

	for _, field := range allowedFields {
		if value, exists := updateData[field]; exists {
			updateMap[field] = value
		}
	}

	if err := DB.Model(&order).Updates(updateMap).Error; err != nil {
		http.Error(w, "Eroare la actualzarea comenzii", http.StatusInternalServerError)
		return
	}

	DB.Preload("Items.Product").First(&order, order.ID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}

func deleteAdminProduct(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	if err := DB.Delete(&Product{}, id).Error; err != nil {
		http.Error(w, "Eroare la ștergere", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func deleteAdminOrder(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	var order Order
	if err := DB.First(&order, id).Error; err != nil {
		http.Error(w, "Order not found", http.StatusNotFound)
		return
	}

	tx := DB.Begin()

	// Șterge mai întâi order items
	if err := tx.Where("order_id = ?", id).Delete(&OrderItem{}).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Eroare la ștergerea items", http.StatusInternalServerError)
		return
	}

	// Apoi șterge order-ul
	if err := tx.Delete(&Order{}, id).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Eroare la ștergerea order-ului", http.StatusInternalServerError)
		return
	}

	tx.Commit()
	w.WriteHeader(http.StatusNoContent)
}

func getCategories(w http.ResponseWriter, r *http.Request) {
	var categories []Category
	var total int64

	// Get query parameters
	query := r.URL.Query()

	// Parse range [start, end]
	rangeHeader := query.Get("range")
	var start, end int
	if rangeHeader != "" {
		var rangeArr []int
		if err := json.Unmarshal([]byte(rangeHeader), &rangeArr); err == nil && len(rangeArr) == 2 {
			start, end = rangeArr[0], rangeArr[1]
		}
	}

	// Default pagination
	if end == 0 {
		start, end = 0, 9
	}
	pageSize := end - start + 1

	// Get total count
	DB.Model(&Category{}).Count(&total)

	// Apply pagination
	offset := start
	limit := pageSize

	// Execute query
	if err := DB.Select("id", "name", "created_at", "updated_at").Offset(offset).Limit(limit).Find(&categories).Error; err != nil {
		http.Error(w, "Eroare la preluarea categoriilor", http.StatusInternalServerError)
		return
	}

	// Set headers for React Admin
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Range")
	w.Header().Set("Content-Range", fmt.Sprintf("categories %d-%d/%d", start, end, total))

	// Return data
	json.NewEncoder(w).Encode(categories)
}

func createCategory(w http.ResponseWriter, r *http.Request) {
	var category Category
	if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
		http.Error(w, "Date invalide", http.StatusBadRequest)
		return
	}

	if category.Name == "" {
		http.Error(w, "Numele categoriesi este obligatoriu", http.StatusBadRequest)
		return
	}

	if err := DB.Create(&category).Error; err != nil {
		http.Error(w, "Eroare la crearea categoriei", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(category)
}

func getAllOrders(w http.ResponseWriter, r *http.Request) {
	var orders []Order
	var total int64

	// Get query parameters
	query := r.URL.Query()

	// Parse range [start, end]
	rangeHeader := query.Get("range")
	var start, end int
	if rangeHeader != "" {
		var rangeArr []int
		if err := json.Unmarshal([]byte(rangeHeader), &rangeArr); err == nil && len(rangeArr) == 2 {
			start, end = rangeArr[0], rangeArr[1]
		}
	}

	// Default pagination
	if end == 0 {
		start, end = 0, 9
	}
	pageSize := end - start + 1

	// Get total count
	DB.Model(&Order{}).Count(&total)

	// Apply pagination
	offset := start
	limit := pageSize

	// Execute query with preloading
	if err := DB.Preload("Items.Product").
		Offset(offset).
		Limit(limit).
		Order("created_at DESC").
		Find(&orders).Error; err != nil {
		http.Error(w, "Error fetching all orders", http.StatusInternalServerError)
		return
	}

	// Set headers for React Admin
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Range")
	w.Header().Set("Content-Range", fmt.Sprintf("orders %d-%d/%d", start, end, total))

	// Return data
	json.NewEncoder(w).Encode(orders)
}

func updateOrderStatus(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi((vars["id"]))
	if err != nil {
		http.Error(w, "ID invalid", http.StatusBadRequest)
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Date invalide", http.StatusBadRequest)
		return
	}

	validStatuses := []string{"pending", "processing", "completed", "cancelled"}
	valid := false
	for _, s := range validStatuses {
		if req.Status == s {
			valid = true
			break
		}
	}
	if !valid {
		http.Error(w, "Status invalid", http.StatusBadRequest)
		return
	}

	if err := DB.Model(&Order{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
		http.Error(w, "Eroare la actualizarea statusului", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Status actualizat cu succes"})
}
