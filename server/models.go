package main

import (
	"time"

	"gorm.io/gorm"
)

type Product struct {
	gorm.Model
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	ImageURL    string  `json:"image_url"`
	Category    string  `json:"category"`
}

type Order struct {
	gorm.Model
	UserID    *uint       `json:"userId"`
	CreatedAt time.Time   `json:"CreatedAt"`
	UpdatedAt time.Time   `json:"UpdatedAt"`
	Name      string      `json:"name"`
	Phone     string      `json:"phone"`
	Email     string      `json:"email"`
	Address   string      `json:"address"`
	City      string      `json:"city"`
	Notes     string      `json:"notes"`
	Status    string      `json:"status" gorm:"default:pending"`
	Total     float64     `json:"total"`
	Items     []OrderItem `json:"items" gorm:"foreignKey:OrderID"`
}

type OrderItem struct {
	gorm.Model
	OrderID   uint    `json:"orderId"`
	ProductID uint    `json:"productId"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
	Product   Product `json:"product" gorm:"foreignKey:ProductID"`
}

type User struct {
	gorm.Model
	Email             string `gorm:"uniqueIndex"`
	Name              string
	Phone             string     `gorm:"not null;default:''"`
	PasswordHash      string     `json:"-"`
	IsVerified        bool       `gorm:"default:false"`
	VerificationToken string     `json:"-"`
	GoogleID          string     `json:"googleId" gorm:"column:google_id"`
	PictureURL        string     `json:"pictureUrl" gorm:"column:picture_url"`
	Orders            []Order    `gorm:"foreignKey:UserID"`
	CartItems         []CartItem `gorm:"foreignKey:UserID"`
}

type CartItem struct {
	gorm.Model
	UserID    uint    `json:"userId" gorm:"index"`
	ProductID uint    `json:"productId" gorm:"index"`
	Quantity  int     `json:"quantity"`
	Product   Product `json:"product" gorm:"foreignKey:ProductID"`
}
