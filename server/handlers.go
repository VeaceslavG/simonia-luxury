package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

type OrderRequest struct {
	Items []struct {
		ProductID uint `json:"productId"`
		Quantity  int  `json:"quantity"`
	} `json:"items"`
}

// Produse
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

// DELETE /api/products/{id}
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

// RESET /api/reset
func resetDatabase(w http.ResponseWriter, r *http.Request) {
	// Șterge toate OrderItem, Orders și Products
	DB.Exec("DELETE FROM order_items")
	DB.Exec("DELETE FROM orders")
	DB.Exec("DELETE FROM products")

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("✅ Toate produsele și comenzile au fost șterse"))
}

// Comenzi
func createOrder(w http.ResponseWriter, r *http.Request) {
	var order Order
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		http.Error(w, "Date invalide", http.StatusBadRequest)
		return
	}

	// Salvează comanda împreună cu produsele
	if err := DB.Create(&order).Error; err != nil {
		http.Error(w, "Eroare la salvarea comenzii", http.StatusInternalServerError)
		return
	}

	go sendEmail(order) // trimite email

	json.NewEncoder(w).Encode(order)
}

func getOrders(w http.ResponseWriter, r *http.Request) {
	var orders []Order
	DB.Preload("Items").Find(&orders)
	json.NewEncoder(w).Encode(orders)
}
