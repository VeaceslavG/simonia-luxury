package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

type contextKey string

const userIDKey contextKey = "userID"

type OrderRequest struct {
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Email   string `json:"email"`
	Address string `json:"address"`
	City    string `json:"city"`
	Notes   string `json:"notes"`
	Items   []struct {
		ProductID uint `json:"productId"`
		Quantity  int  `json:"quantity"`
	} `json:"items"`
}

// --- Produse ---
func getProducts(w http.ResponseWriter, r *http.Request) {
	var products []Product
	if err := DB.Preload("Category").Where("is_active = ?", true).Find(&products).Error; err != nil {
		http.Error(w, "Eroare la preluarea produselor", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=UTF-8")
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

// --- Comenzi ---
func createOrder(w http.ResponseWriter, r *http.Request) {
	var req OrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Date invalide", http.StatusBadRequest)
		return
	}

	if req.Phone == "" {
		http.Error(w, "Numărul de telefon este obligatoriu pentru comandă", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value(userIDKey).(uint)
	var userIDPtr *uint
	if ok {
		userIDPtr = &userID
		log.Printf("Creating order for user ID: %d", userID)

		var user User
		if err := DB.First(&user, userID).Error; err == nil {
			user.Phone = req.Phone
			DB.Save(&user)
		}
	} else {
		userIDPtr = nil
		log.Println("Creating order for anonymous user")
	}

	order := Order{
		UserID:  userIDPtr,
		Name:    req.Name,
		Phone:   req.Phone,
		Email:   req.Email,
		Address: req.Address,
		City:    req.City,
		Notes:   req.Notes,
		Status:  "pending",
	}

	var totalCents int64
	for _, item := range req.Items {
		var product Product
		if err := DB.First(&product, item.ProductID).Error; err != nil {
			http.Error(w, fmt.Sprintf("Produsul cu ID %d nu există", item.ProductID), http.StatusBadRequest)
			return
		}

		total := product.PriceCents * int64(item.Quantity)
		totalCents += total

		order.Items = append(order.Items, OrderItem{
			ProductID:  item.ProductID,
			Quantity:   item.Quantity,
			PriceCents: product.PriceCents,
		})

	}

	order.TotalCents = totalCents
	order.Total = float64(totalCents) / 100

	if err := DB.Create(&order).Error; err != nil {
		log.Printf("Error creating order: %v", err)
		http.Error(w, "Eroare la salvarea comenzii", http.StatusInternalServerError)
		return
	}

	// Reîncarcă order-ul cu toate datele din baza de date
	var completeOrder Order
	if err := DB.Preload("Items.Product").First(&completeOrder, order.ID).Error; err != nil {
		log.Printf("Error reloading order: %v", err)
		completeOrder = order
	}

	log.Printf("Sending email for order ID=%d, Address='%s', City='%s'",
		completeOrder.ID, completeOrder.Address, completeOrder.City)

	go func(order Order) {
		if err := sendEmail(order); err != nil {
			log.Printf("CRITICAL: Failed to send email for order #%d: %v", order.ID, err)

			DB.Model(&Order{}).Where("id = ?", order.ID).
				Update("email_sent", false).
				Update("email_error", err.Error())
		}
	}(completeOrder)

	go func(orderID uint) {
		time.Sleep(5 * time.Second)
		if err := DB.Model(&Order{}).
			Where("id = ?", orderID).
			Update("status", "completed").Error; err != nil {
			log.Printf("Eroare la actualizarea statusului pentru order #%d: %v", orderID, err)
		} else {
			log.Printf("Order #%d marcat ca 'completed'", orderID)
		}
	}(completeOrder.ID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(completeOrder)
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
		DB.Preload("Category").Where("is_active = ?", true).Find(&products)
	} else {
		searchPattern := "%" + strings.ToLower(query) + "%"

		DB.Preload("Category").
			Where("(unaccent(LOWER(name)) LIKE unaccent(LOWER(?)) OR unaccent(LOWER(description)) LIKE unaccent(LOWER(?))) AND is_active = ?",
				searchPattern, searchPattern, true).
			Find(&products)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

// --- Cart ---
func getUserOrders(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(userIDKey).(uint)
	log.Println("UserID from context:", userID, ok)
	if !ok {
		http.Error(w, "Neautorizat", http.StatusUnauthorized)
		return
	}
	var orders []Order
	if err := DB.Preload("Items.Product").Where("user_id = ?", userID).Order("created_at DESC").Find(&orders).Error; err != nil {
		log.Println("Error fetching orders:", err)
		http.Error(w, "Eroare la fetch orders", http.StatusInternalServerError)
		return
	}
	log.Printf("Orders fetched for user %d: %d orders found\n", userID, len(orders))
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(orders)
}

func addToCart(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(userIDKey).(uint)

	var input struct {
		ProductID uint `json:"productId"`
		Quantity  int  `json:"quantity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Guest -> Cookies
	if !ok {
		items, _ := getGuestCart(r)
		updated := false
		for i, it := range items {
			if it.ProductID == input.ProductID {
				items[i].Quantity += input.Quantity
				updated = true
			}
		}
		if !updated {
			items = append(items, GuestCartItem{ProductID: input.ProductID, Quantity: input.Quantity})
		}
		saveGuestCart(w, items)
		json.NewEncoder(w).Encode(items)
		return
	}

	// Logged-in -> DB
	var item CartItem
	err := DB.Where("user_id = ? AND product_id = ?", userID, input.ProductID).First(&item).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		item = CartItem{UserID: userID, ProductID: input.ProductID, Quantity: input.Quantity}
		DB.Create(&item)
	} else {
		item.Quantity += input.Quantity
		DB.Save(&item)
	}
	DB.Preload("Product").First(&item, item.ID)
	json.NewEncoder(w).Encode(item)
}

func updateCartItem(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(userIDKey).(uint)

	vars := mux.Vars(r)
	itemIDStr := vars["id"]

	itemIDInt, err := strconv.Atoi(itemIDStr)

	if err != nil {
		http.Error(w, "Invalid item ID", http.StatusBadRequest)
	}

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

	// Guest
	if !ok {
		items, _ := getGuestCart(r)
		found := false

		for i, it := range items {
			if int(it.ProductID) == itemIDInt {
				items[i].Quantity = req.Quantity
				found = true
				break
			}
		}

		if !found {
			http.Error(w, "Cart item not found", http.StatusNotFound)
			return
		}

		saveGuestCart(w, items)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(items)
		return
	}

	// user logat
	itemID := uint(itemIDInt)

	var cartItem CartItem
	if err := DB.Where("id = ? AND user_id = ?", itemID, userID).
		First(&cartItem).Error; err != nil {
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
	vars := mux.Vars(r)
	itemID := vars["id"]

	if !ok {
		// Guest mode → remove from cookie
		productID, _ := strconv.Atoi(itemID)
		items, _ := getGuestCart(r)
		newItems := []GuestCartItem{}
		for _, it := range items {
			if int(it.ProductID) != productID {
				newItems = append(newItems, it)
			}
		}
		saveGuestCart(w, newItems)
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// Logged-in → DB
	if err := DB.Where("id = ? AND user_id = ?", itemID, userID).Delete(&CartItem{}).Error; err != nil {
		http.Error(w, "Failed to remove item from cart", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func clearCart(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value(userIDKey).(uint)

	if !ok {
		saveGuestCart(w, []GuestCartItem{})
		w.WriteHeader(http.StatusNoContent)
		return
	}

	DB.Where("user_id = ?", userID).Delete(&CartItem{})
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
	if ok {
		// Logged-in -> DB
		var cartItems []CartItem
		if err := DB.Preload("Product").Where("user_id = ?", userID).Find(&cartItems).Error; err != nil {
			http.Error(w, "Failed to fetch cart", http.StatusInternalServerError)
			return
		}

		result := []map[string]interface{}{}
		for _, item := range cartItems {
			result = append(result, map[string]interface{}{
				"id":        item.ID,
				"productId": item.ProductID,
				"quantity":  item.Quantity,
				"product":   item.Product,
			})
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
		return
	}

	// Guest -> Cookie
	items, _ := getGuestCart(r)
	result := []map[string]interface{}{}
	for _, it := range items {
		var prod Product
		if err := DB.First(&prod, it.ProductID).Error; err == nil {
			result = append(result, map[string]interface{}{
				"id":        it.ProductID,
				"productId": it.ProductID,
				"quantity":  it.Quantity,
				"product":   prod,
				"tempId":    fmt.Sprintf("guest-%d", it.ProductID),
			})
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func mergeGuestCartToUser(w http.ResponseWriter, r *http.Request, userID uint) {
	log.Println("mergeGuestCartToUser CALLED!")
	log.Printf("UserID: %d", userID)
	log.Printf("Request URL: %s", r.URL.Path)

	// 1. Get guest cart
	items, err := getGuestCart(r)
	if err != nil {
		log.Printf("Error getting guest cart: %v", err)
		return
	}

	log.Printf("Guest cart items count: %d", len(items))

	// 2. DEBUG: Log each item
	for i, item := range items {
		log.Printf("Item %d: ProductID=%d, Quantity=%d", i+1, item.ProductID, item.Quantity)

		// Verify product exists
		var product Product
		if err := DB.First(&product, item.ProductID).Error; err != nil {
			log.Printf("Product %d not found in DB!", item.ProductID)
			continue
		}
		log.Printf("Product %d exists: %s", item.ProductID, product.Name)
	}

	if len(items) == 0 {
		log.Println("No items to migrate")
		return
	}

	// 3. Migrate each item
	migratedCount := 0
	for _, item := range items {
		// Check if product exists
		var product Product
		if err := DB.First(&product, item.ProductID).Error; err != nil {
			log.Printf("Skipping product %d - not found", item.ProductID)
			continue
		}

		// Check if already in user's cart
		var existing CartItem
		if err := DB.Where("user_id = ? AND product_id = ?", userID, item.ProductID).
			First(&existing).Error; err == nil {
			// Update existing
			oldQty := existing.Quantity
			existing.Quantity += item.Quantity
			if err := DB.Save(&existing).Error; err != nil {
				log.Printf("Error updating cart item: %v", err)
			} else {
				log.Printf("Updated: product %d, %d -> %d",
					item.ProductID, oldQty, existing.Quantity)
				migratedCount++
			}
		} else {
			// Create new
			cartItem := CartItem{
				UserID:    userID,
				ProductID: item.ProductID,
				Quantity:  item.Quantity,
			}
			if err := DB.Create(&cartItem).Error; err != nil {
				log.Printf("Error creating cart item: %v", err)
			} else {
				log.Printf("Created: product %d, quantity %d",
					item.ProductID, item.Quantity)
				migratedCount++
			}
		}
	}

	// 4. Clear guest cart
	saveGuestCart(w, []GuestCartItem{})
	log.Printf("MIGRATION COMPLETE: %d/%d items migrated", migratedCount, len(items))
}
