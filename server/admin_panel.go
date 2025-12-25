package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"github.com/lib/pq"
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

var adminJWTKey []byte

func init() {
	adminJWTKey = []byte(os.Getenv("JWT_SECRET_ADMIN"))
}

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
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
	})

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message":  "Login successful",
		"username": creds.Username,
	})
}

func adminLogout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "admin_token",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		Expires:  time.Now().Add(-time.Hour),
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteNoneMode,
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
			tokenString = strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
			if len(tokenString) > 10 {
				log.Println("Found Bearer token in header:", tokenString[:10]+"...")
			} else {
				log.Println("Found Bearer token in header (short):", tokenString)
			}
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
	if err := DB.Preload("Category").Order(sortField + " " + sortOrder).Offset(offset).Limit(limit).Find(&products).Error; err != nil {
		http.Error(w, "Eroare la preluarea produselor", http.StatusInternalServerError)
		return
	}

	for i := range products {
		products[i].Price = float64(products[i].PriceCents) / 100.0
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

	if err := DB.Preload("Category").First(&product, id).Error; err != nil {
		http.Error(w, "Produsul nu a fost găsit", http.StatusNotFound)
		return
	}

	product.Price = float64(product.PriceCents) / 100

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

	if product.PriceCents <= 0 {
		http.Error(w, "Pretul trebuie sa fie mai mare decat 0", http.StatusBadRequest)
		return
	}

	if !product.IsAvailable {
		product.IsAvailable = true
	}
	if !product.IsActive {
		product.IsActive = true
	}

	var cat Category
	if err := DB.First(&cat, product.CategoryID).Error; err != nil {
		http.Error(w, "Category does not exist", http.StatusBadRequest)
		return
	}

	if err := DB.Omit("Price").Create(&product).Error; err != nil {
		http.Error(w, "Eroare la creare", http.StatusInternalServerError)
		return
	}

	DB.Preload("Category").First(&product, product.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func adminUpload(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(10 << 20)

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "File missing", http.StatusBadRequest)
		return
	}
	defer file.Close()

	os.MkdirAll("./uploads/products", os.ModePerm)

	filename := fmt.Sprintf(
		"%d_%s",
		time.Now().Unix(),
		handler.Filename,
	)

	dst, err := os.Create("./uploads/products/" + filename)
	if err != nil {
		http.Error(w, "Cannot save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	_, err = io.Copy(dst, file)
	if err != nil {
		http.Error(w, "Upload failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"url": "/uploads/products/" + filename,
	})
}

func updateProduct(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]

	var product Product
	if err := DB.First(&product, id).Error; err != nil {
		http.Error(w, "Produsul nu a fost găsit", http.StatusNotFound)
		return
	}

	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Date invalide", http.StatusBadRequest)
		return
	}

	update := map[string]interface{}{}

	if v, ok := payload["name"]; ok {
		update["name"] = v
	}
	if v, ok := payload["description"]; ok {
		update["description"] = v
	}
	if v, ok := payload["price_cents"]; ok {
		var cents int64

		switch price := v.(type) {
		case float64:
			cents = int64(math.Round(price))
		case int:
			cents = int64(price)
		case int64:
			cents = int64(price)
		default:
			http.Error(w, "Pret invalid", http.StatusBadRequest)
			return
		}

		if cents <= 0 {
			http.Error(w, "Pret invalid", http.StatusBadRequest)
			return
		}

		update["price_cents"] = cents
	}
	if v, ok := payload["dimensions"]; ok {
		update["dimensions"] = v
	}
	if v, ok := payload["is_active"]; ok {
		update["is_active"] = v
	}
	if v, ok := payload["is_available"]; ok {
		update["is_available"] = v
	}
	if v, ok := payload["image_urls"]; ok {

		switch val := v.(type) {

		case string:
			// vine un singur URL → îl punem în array
			update["image_urls"] = pq.StringArray{val}

		case []interface{}:
			urls := []string{}
			for _, u := range val {
				if s, ok := u.(string); ok {
					urls = append(urls, s)
				}
			}
			update["image_urls"] = pq.StringArray(urls)
		}
	}

	if v, ok := payload["category_id"]; ok {
		var catID uint

		switch id := v.(type) {
		case float64:
			catID = uint(id)
		case int:
			catID = uint(id)
		case int64:
			catID = uint(id)
		default:
			http.Error(w, "Category ID invalid", http.StatusBadRequest)
			return
		}

		var count int64
		DB.Model(&Category{}).Where("id = ?", catID).Count(&count)
		if count == 0 {
			http.Error(w, "Categoria nu există", http.StatusBadRequest)
			return
		}

		update["category_id"] = catID
	}

	delete(update, "price")

	if err := DB.Model(&product).Updates(update).Error; err != nil {
		http.Error(w, "Eroare la actualizare", http.StatusInternalServerError)
		return
	}

	product.Price = float64(product.PriceCents) / 100

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
