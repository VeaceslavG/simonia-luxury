package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

// Middleware CORS
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Permitem frontend-ul
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Răspundem la preflight request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func getProductByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID invalid", http.StatusBadRequest)
		return
	}

	var product Product
	result := DB.First(&product, id)
	if result.Error != nil {
		http.Error(w, "Produsul nu a fost găsit", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(product); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

// Funcție pentru popularea produselor de test (doar dacă nu există)
func seedProducts() {
	// Șterge toate produsele existente
	DB.Exec("DELETE FROM products")

	categories := map[string]Product{
		"Canapele": {
			Name:        "Canapea Confort",
			Description: "O canapea foarte confortabilă – dimensiuni: 200x90x85 cm",
			Price:       350,
			ImageURL:    "http://localhost:8080/images/canapea.jpg",
			Category:    "Canapele",
		},
		"Coltare": {
			Name:        "Colțar Modern",
			Description: "Colțar extensibil – dimensiuni: 250x150x90 cm",
			Price:       1600,
			ImageURL:    "http://localhost:8080/images/coltar.jpg",
			Category:    "Coltare",
		},
		"Fotolii": {
			Name:        "Fotoliu Relaxare",
			Description: "Fotoliu confortabil – dimensiuni: 90x90x100 cm",
			Price:       500,
			ImageURL:    "http://localhost:8080/images/fotoliu.jpg",
			Category:    "Fotolii",
		},
		"Paturi": {
			Name:        "Pat Matrimonial",
			Description: "Pat confortabil – dimensiuni: 200x180x50 cm",
			Price:       1400,
			ImageURL:    "http://localhost:8080/images/pat.jpg",
			Category:    "Paturi",
		},
	}

	for _, template := range categories {
		for i := 1; i <= 8; i++ {
			p := template
			p.Name = template.Name + " " + strconv.Itoa(i) // face numele unic
			DB.Create(&p)
		}
	}

	log.Println("✅ Produsele au fost resetate și adăugate cu 8 produse per categorie")
}

func main() {
	// Încarcă variabilele din .env
	if err := godotenv.Load(); err != nil {
		log.Fatal("Eroare la încărcarea fișierului .env")
	}

	// Conectare la DB
	ConnectDB()
	DB.AutoMigrate(&Product{}, &Order{}, &OrderItem{})

	// Adaugă produsele de test
	seedProducts()

	// Router
	r := mux.NewRouter()

	// CORS
	r.Use(enableCORS)

	// Produse
	r.HandleFunc("/api/products", createProduct).Methods("POST")
	r.HandleFunc("/api/products", getProducts).Methods("GET")
	r.HandleFunc("/api/products/{id}", deleteProduct).Methods("DELETE")
	r.HandleFunc("/api/products/{id}", getProductByID).Methods("GET")

	// Servește imaginile statice
	r.PathPrefix("/images/").Handler(http.StripPrefix("/images/", http.FileServer(http.Dir("./assets/products/"))))

	// Comenzi
	r.HandleFunc("/api/orders", createOrder).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/orders", getOrders).Methods("GET", "OPTIONS")

	// Reset DB (opțional)
	r.HandleFunc("/api/reset", resetDatabase).Methods("POST")

	r.HandleFunc("/api/test", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("CORS funcționează!"))
	}).Methods("GET", "OPTIONS")

	// Pornire server
	log.Println("🚀 Serverul pornește pe :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
