package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

type contextKey string

const userIDKey contextKey = "userID"

type OrderRequest struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
	Email string `json:"email"`
	Notes string `json:"notes"`
	Items []struct {
		ProductID uint `json:"productId"`
		Quantity  int  `json:"quantity"`
	} `json:"items"`
}

// --- Produse ---
func createProduct(w http.ResponseWriter, r *http.Request) {
	var product Product
	if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
		http.Error(w, "Date invalide", http.StatusBadRequest)
		return
	}
	DB.Create(&product)
	json.NewEncoder(w).Encode(product)
}

func getProducts(w http.ResponseWriter, r *http.Request) {
	var products []Product
	DB.Find(&products)
	json.NewEncoder(w).Encode(products)
}

func deleteProduct(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	if err := DB.Delete(&Product{}, id).Error; err != nil {
		http.Error(w, "Eroare la ștergerea produsului", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(fmt.Sprintf("Produsul cu ID %s a fost șters", id)))
}

func resetDatabase(w http.ResponseWriter, _ *http.Request) {
	DB.Exec("DELETE FROM order_items")
	DB.Exec("DELETE FROM orders")
	DB.Exec("DELETE FROM products")

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("✅ Toate produsele și comenzile au fost șterse"))
}

// --- Comenzi ---
func createOrder(w http.ResponseWriter, r *http.Request) {
	var req OrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Date invalide", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(userIDKey).(uint)
	var userIDPtr *uint
	if ok {
		userIDPtr = &userID
	} else {
		userIDPtr = nil // utilizator anonim
	}

	order := Order{
		UserID: userIDPtr,
		Name:   req.Name,
		Phone:  req.Phone,
		Email:  req.Email,
		Notes:  req.Notes,
		Status: "pending",
	}

	var total float64
	for _, item := range req.Items {
		var product Product
		if err := DB.First(&product, item.ProductID).Error; err != nil {
			http.Error(w, fmt.Sprintf("Produsul cu ID %d nu există", item.ProductID), http.StatusBadRequest)
			return
		}

		order.Items = append(order.Items, OrderItem{
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     product.Price,
		})

		total += product.Price * float64(item.Quantity)
	}

	order.Total = total

	if err := DB.Create(&order).Error; err != nil {
		http.Error(w, "Eroare la salvarea comenzii", http.StatusInternalServerError)
		return
	}

	DB.Preload("Items.Product").First(&order, order.ID)

	go sendEmail(order)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(order)
}

func GetProductByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID invalid", http.StatusBadRequest)
		return
	}

	var product Product
	if err := DB.First(&product, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Produsul nu a fost găsit"})
			return
		}
		http.Error(w, "Eroare server", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(product)
}

func SearchProducts(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	var products []Product

	if query == "" {
		DB.Find(&products)
	} else {
		DB.Where("LOWER(name) LIKE ? OR LOWER(category) LIKE ?", "%"+strings.ToLower(query)+"%", "%"+strings.ToLower(query)+"%").Find(&products)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// --- Cart ---
func getUserOrders(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(userIDKey).(uint)
	var orders []Order
	DB.Preload("Items.Product").Where("user_id = ?", userID).Find(&orders)
	json.NewEncoder(w).Encode(orders)
}

func addToCart(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(userIDKey).(uint)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var input struct {
		ProductID uint `json:"productId"`
		Quantity  int  `json:"quantity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	if input.ProductID == 0 || input.Quantity < 1 {
		http.Error(w, "productId sau quantity invalid", http.StatusBadRequest)
		return
	}

	var prod Product
	if err := DB.First(&prod, input.ProductID).Error; err != nil {
		http.Error(w, "Produsul nu exsta", http.StatusBadRequest)
		return
	}

	var item CartItem
	err := DB.Where("user_id = ? AND product_id = ?", userID, input.ProductID).First(&item).Error

	switch {
	case errors.Is(err, gorm.ErrRecordNotFound):
		// 4a) NU există → creează unul nou
		item = CartItem{
			UserID:    userID,
			ProductID: input.ProductID,
			Quantity:  input.Quantity,
		}
		if err := DB.Create(&item).Error; err != nil {
			http.Error(w, "DB error (create)", http.StatusInternalServerError)
			return
		}

	case err == nil:
		// 4b) EXISTĂ → incrementăm cantitatea
		item.Quantity += input.Quantity
		if err := DB.Save(&item).Error; err != nil {
			http.Error(w, "DB error (update)", http.StatusInternalServerError)
			return
		}

	default:
		http.Error(w, "DB error (find)", http.StatusInternalServerError)
		return
	}

	// Preload Product pentru a avea toate detaliile
	if err := DB.Preload("Product").First(&item, item.ID).Error; err != nil {
		http.Error(w, "Failed to load product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(item)
}

func updateCartItem(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(userIDKey).(uint)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	itemIDStr := vars["id"]

	itemIDInt, err := strconv.Atoi(itemIDStr)

	if err != nil {
		http.Error(w, "Invalid item ID", http.StatusBadRequest)
	}

	itemID := uint(itemIDInt)

	var req struct {
		Quantity int `json:"quantity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Quantity < 1 {
		http.Error(w, "Quantity must be at least 1", http.StatusBadRequest)
		return
	}

	var cartItem CartItem
	if err := DB.Where("id = ? AND user_id = ?", itemID, userID).First(&cartItem).Error; err != nil {
		http.Error(w, "Cart item not found", http.StatusNotFound)
		return
	}

	cartItem.Quantity = req.Quantity
	if err := DB.Save(&cartItem).Error; err != nil {
		http.Error(w, "Failed to update cart item", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cartItem)
}

func removeCartItem(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(userIDKey).(uint)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	itemID := vars["id"]

	if err := DB.Where("id = ? AND user_id = ?", itemID, userID).Delete(&CartItem{}).Error; err != nil {
		http.Error(w, "Failed to remove item from cart", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func clearCart(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(userIDKey).(uint)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	if err := DB.Where("user_id = ?", userID).Delete(&CartItem{}).Error; err != nil {
		http.Error(w, "Failed to clear cart", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func syncCart(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(userIDKey).(uint)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	var input struct {
		Items []struct {
			ProductID uint `json:"productId"`
			Quantity  int  `json:"quantity"`
		} `json:"items"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := DB.Where("user_id = ?", userID).Delete(&CartItem{}).Error; err != nil {
		http.Error(w, "Failed to clear existing cart", http.StatusInternalServerError)
		return
	}

	for _, item := range input.Items {
		var existing CartItem
		if err := DB.Where("user_id = ? AND product_id = ?", userID, item.ProductID).First(&existing).Error; err == nil {
			existing.Quantity += item.Quantity
			DB.Save(&existing)
		} else {
			cartItem := CartItem{
				UserID:    userID,
				ProductID: item.ProductID,
				Quantity:  item.Quantity,
			}
			DB.Create(&cartItem)
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Cart synced successfully"})
}

func getCart(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(userIDKey).(uint)
	if !ok {
		http.Error(w, "User ID not found in context", http.StatusUnauthorized)
		return
	}

	var cartItems []CartItem
	DB.Preload("Product").Where("user_id = ?", userID).Find(&cartItems)
	if err := DB.Preload("Product").Where("user_id = ?", userID).Find(&cartItems).Error; err != nil {
		http.Error(w, "Failed to fetch cart", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cartItems)
}
