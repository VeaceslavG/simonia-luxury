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
		log.Printf("✅ Creating order for user ID: %d", userID)

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

	go sendEmail(completeOrder)

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

		var result []map[string]interface{}
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
	var result []map[string]interface{}
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
	log.Println("🔄 mergeGuestCartToUser called for user:", userID)

	items, err := getGuestCart(r)
	if err != nil {
		log.Println("❌ Error getting guest cart:", err)
		return
	}

	log.Printf("📦 Found %d items in guest cart", len(items))

	if len(items) == 0 {
		log.Println("ℹ️ No guest cart items to merge")
		return
	}

	for i, it := range items {
		log.Printf("🔄 Processing guest item %d: ProductID=%d, Quantity=%d", i, it.ProductID, it.Quantity)

		// Verifică dacă produsul există
		var product Product
		if err := DB.First(&product, it.ProductID).Error; err != nil {
			log.Printf("❌ Product %d not found, skipping", it.ProductID)
			continue
		}

		var existing CartItem
		if err := DB.Where("user_id = ? AND product_id = ?", userID, it.ProductID).First(&existing).Error; err == nil {
			// Item existent - actualizează cantitatea
			oldQuantity := existing.Quantity
			existing.Quantity += it.Quantity
			if err := DB.Save(&existing).Error; err != nil {
				log.Println("❌ Error updating existing cart item:", err)
			} else {
				log.Printf("✅ Updated existing item: product %d, quantity %d -> %d",
					it.ProductID, oldQuantity, existing.Quantity)
			}
		} else {
			// Item nou - creează
			cartItem := CartItem{
				UserID:    userID,
				ProductID: it.ProductID,
				Quantity:  it.Quantity,
			}
			if err := DB.Create(&cartItem).Error; err != nil {
				log.Println("❌ Error creating new cart item:", err)
			} else {
				log.Printf("✅ Created new item: product %d, quantity %d", it.ProductID, it.Quantity)
			}
		}
	}

	// Curăță cookie-ul guest cart
	saveGuestCart(w, []GuestCartItem{})
	log.Println("✅ Guest cart merged and cleared")
}
