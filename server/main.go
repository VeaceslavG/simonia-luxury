package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

// Middleware CORS
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	godotenv.Load()
	// Încarcă variabilele din .env
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️ Nu am găsit .env, folosim valorile implicite")
	}

	// Conectare DB
	ConnectDB()
	// DB.Migrator().DropTable(&OrderItem{}, &Order{}, &CartItem{}, &Product{}, &User{})
	DB.AutoMigrate(&Product{}, &Order{}, &OrderItem{}, &User{}, &CartItem{})

	// Populează produse de test
	// SeedProducts()

	// Router
	r := mux.NewRouter()
	r.Use(enableCORS)

	// --- Auth ---
	r.HandleFunc("/api/verify", handleVerify).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/register", handleRegister).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/login", handleLogin).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/logout", handleLogout).Methods("POST")
	r.Handle("/api/me", authMiddleware(http.HandlerFunc(handleMe))).Methods("GET", "OPTIONS")

	// --- Google Auth ---
	r.HandleFunc("/api/auth/google/login", handleGoogleLogin)
	r.HandleFunc("/api/auth/google/callback", handleGoogleCallback)

	// --- Cart & Orders ---
	// GET orders (necesită autentificare)
	r.Handle("/api/orders", authMiddleware(requireAuth(http.HandlerFunc(getUserOrders)))).Methods("GET", "OPTIONS")
	// POST orders (poate fi și pentru utilizatori anonimi)
	r.Handle("/api/orders", authMiddleware(http.HandlerFunc(createOrder))).Methods("POST", "OPTIONS")

	// --- Debug ---
	//! r.HandleFunc("/api/debug/orders", getAllOrders).Methods("GET")

	// --- Produse ---
	//! r.HandleFunc("/api/products", createProduct).Methods("POST")
	r.HandleFunc("/api/products", getProducts).Methods("GET")
	r.HandleFunc("/api/products/{id}", deleteProduct).Methods("DELETE")
	r.HandleFunc("/api/products/{id}", GetProductByID).Methods("GET")

	// --- Cart Endpoints ---
	r.Handle("/api/cart", authMiddleware(http.HandlerFunc(getCart))).Methods("GET", "OPTIONS")
	r.Handle("/api/cart", authMiddleware(http.HandlerFunc(addToCart))).Methods("POST", "OPTIONS")
	r.Handle("/api/cart", authMiddleware(http.HandlerFunc(clearCart))).Methods("DELETE", "OPTIONS")
	r.Handle("/api/cart/item/{id}", authMiddleware(http.HandlerFunc(updateCartItem))).Methods("PUT", "OPTIONS")
	r.Handle("/api/cart/item/{id}", authMiddleware(http.HandlerFunc(removeCartItem))).Methods("DELETE", "OPTIONS")
	r.Handle("/api/cart/sync", authMiddleware(http.HandlerFunc(syncCart))).Methods("POST", "OPTIONS")

	// --- Search ---
	r.HandleFunc("/api/search", SearchProducts).Methods("GET")

	// --- Reset DB (opțional) ---
	//! r.HandleFunc("/api/reset", resetDatabase).Methods("POST")

	// --- Servește imagini statice ---
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads/"))))

	// --- Test CORS ---
	r.HandleFunc("/api/test", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("CORS funcționează!"))
	}).Methods("GET", "OPTIONS")

	log.Println("🚀 Serverul pornește pe :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
