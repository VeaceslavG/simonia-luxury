package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

// Middleware CORS
func enableCORS(next http.Handler) http.Handler {
	allowedOrigin := os.Getenv("FRONTEND_URL")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		if origin != "" && origin == allowedOrigin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Range, Content-Range, X-Total-Count, Sort, Filter")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Expose-Headers", "Content-Range, X-Total-Count")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	godotenv.Load()

	// Conectare DB
	ConnectDB()
	DB.AutoMigrate(&Product{}, &Order{}, &OrderItem{}, &User{}, &CartItem{})

	// Router
	r := mux.NewRouter()
	r.Use(enableCORS)

	// --- Public Routes ---
	// Auth
	r.HandleFunc("/api/verify", handleVerify).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/register", handleRegister).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/login", handleLogin).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/logout", handleLogout).Methods("POST", "OPTIONS")
	r.Handle("/api/me", authMiddleware(http.HandlerFunc(handleMe))).Methods("GET", "OPTIONS")

	// Google Auth
	r.HandleFunc("/api/auth/google/login", handleGoogleLogin).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/auth/google/callback", handleGoogleCallback).Methods("GET", "OPTIONS")

	// Products (public)
	r.HandleFunc("/api/products", getProducts).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/products/{id}", GetProductByID).Methods("GET", "OPTIONS")

	// Search
	r.HandleFunc("/api/search", SearchProducts).Methods("GET", "OPTIONS")

	// --- Authenticated User Routes ---
	// Orders
	r.Handle("/api/orders", authMiddleware(requireAuth(http.HandlerFunc(getUserOrders)))).Methods("GET", "OPTIONS")
	r.Handle("/api/orders", authMiddleware(http.HandlerFunc(createOrder))).Methods("POST", "OPTIONS")

	// Cart
	r.Handle("/api/cart", authMiddleware(http.HandlerFunc(getCart))).Methods("GET", "OPTIONS")
	r.Handle("/api/cart", authMiddleware(http.HandlerFunc(addToCart))).Methods("POST", "OPTIONS")
	r.Handle("/api/cart", authMiddleware(http.HandlerFunc(clearCart))).Methods("DELETE", "OPTIONS")
	r.Handle("/api/cart/item/{id}", authMiddleware(http.HandlerFunc(updateCartItem))).Methods("PUT", "OPTIONS")
	r.Handle("/api/cart/item/{id}", authMiddleware(http.HandlerFunc(removeCartItem))).Methods("DELETE", "OPTIONS")
	r.Handle("/api/cart/sync", authMiddleware(http.HandlerFunc(syncCart))).Methods("POST", "OPTIONS")

	// --- ADMIN ROUTES ---
	adminRouter := r.PathPrefix("/api/admin").Subrouter()

	// Admin Auth (public)
	adminRouter.HandleFunc("/login", adminLogin).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/logout", adminLogout).Methods("POST", "OPTIONS")
	adminRouter.HandleFunc("/me", adminMe).Methods("GET", "OPTIONS")

	// Admin Protected Routes
	protectedAdmin := adminRouter.PathPrefix("").Subrouter()
	protectedAdmin.Use(adminAuth)

	// Admin Products
	protectedAdmin.HandleFunc("/upload", adminUpload).Methods("POST", "OPTIONS")
	protectedAdmin.HandleFunc("/products", getAdminProducts).Methods("GET", "OPTIONS")
	protectedAdmin.HandleFunc("/products", createAdminProduct).Methods("POST", "OPTIONS")
	protectedAdmin.HandleFunc("/products/{id}", getAdminProduct).Methods("GET", "OPTIONS")
	protectedAdmin.HandleFunc("/products/{id}", updateProduct).Methods("PUT", "OPTIONS")
	protectedAdmin.HandleFunc("/products/{id}", deleteAdminProduct).Methods("DELETE", "OPTIONS")

	// Admin Categories
	protectedAdmin.HandleFunc("/categories", getCategories).Methods("GET", "OPTIONS")
	protectedAdmin.HandleFunc("/categories", createCategory).Methods("POST", "OPTIONS")

	// Admin Orders
	protectedAdmin.HandleFunc("/orders", getAllOrders).Methods("GET", "OPTIONS")
	protectedAdmin.HandleFunc("/orders/{id}", updateOrderStatus).Methods("PUT", "OPTIONS")
	protectedAdmin.HandleFunc("/orders/{id}", deleteAdminOrder).Methods("DELETE", "OPTIONS")

	// Admin users
	protectedAdmin.HandleFunc("/users", getAdminUsers).Methods("GET", "OPTIONS")

	// --- Static Files ---
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads/"))))

	// --- Test Route ---
	r.HandleFunc("/api/test", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("CORS funcționează!"))
	}).Methods("GET", "OPTIONS")

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = os.Getenv("PORT")
	}
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Serverul pornește pe :%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
