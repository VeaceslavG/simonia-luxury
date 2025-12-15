package main

import (
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Category struct {
	gorm.Model
	Name      string    `gorm:"unique;not null" json:"name"`
	CreatedAt time.Time `json:"created_at"`
	Products  []Product `json:"products,omitempty"`
}

type Product struct {
	gorm.Model
	ID           uint           `gorm:"primaryKey" json:"id"`
	Name         string         `gorm:"not null" json:"name"`
	Description  string         `json:"description"`
	Price        float64        `gorm:"type:decimal(10,2);not null" json:"price"`
	CategoryID   uint           `json:"category_id"`
	Category     Category       `json:"category" gorm:"foreignKey:CategoryID"`
	Dimensions   string         `json:"dimensions"`
	ImageURLs    pq.StringArray `gorm:"type:text[]" json:"image_urls"`
	IsAvailable  bool           `gorm:"default:true" json:"is_available"`
	DeliveryTime string         `gorm:"default:'2-3 saptamani'" json:"delivery_time"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

type Order struct {
	gorm.Model
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    *uint          `json:"userId"`
	User      User           `json:"user,omitempty"`
	Name      string         `gorm:"not null" json:"name"`
	Phone     string         `gorm:"not null" json:"phone"`
	Email     string         `json:"email"`
	Address   string         `gorm:"not null" json:"address"`
	City      string         `gorm:"not null" json:"city"`
	Notes     string         `json:"notes"`
	Status    string         `gorm:"default:'pending'" json:"status"`
	Total     float64        `gorm:"type:decimal(10,2);not null" json:"total"`
	Items     []OrderItem    `json:"items" gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type OrderItem struct {
	gorm.Model
	ID        uint      `gorm:"primaryKey" json:"id"`
	OrderID   uint      `json:"orderId"`
	ProductID uint      `json:"productId"`
	Quantity  int       `gorm:"not null" json:"quantity"`
	Price     float64   `gorm:"type:decimal(10,2);not null" json:"price"`
	CreatedAt time.Time `json:"created_at"`
	Product   Product   `json:"product" gorm:"foreignKey:ProductID"`
}

type User struct {
	gorm.Model
	ID                    uint      `gorm:"primaryKey" json:"id"`
	Email                 string    `gorm:"uniqueIndex" json:"email"`
	Name                  string    `json:"name"`
	Phone                 string    `gorm:"not null;default:''" json:"phone"`
	PasswordHash          string    `json:"-"`
	IsVerified            bool      `gorm:"default:false" json:"is_verified"`
	CreatedAt             time.Time `json:"created_at"`
	VerificationToken     string    `json:"-"`
	VerificationExpiresAt time.Time
	GoogleID              string     `json:"googleId" gorm:"column:google_id"`
	PictureURL            string     `json:"pictureUrl" gorm:"column:picture_url"`
	Orders                []Order    `gorm:"foreignKey:UserID"`
	CartItems             []CartItem `gorm:"foreignKey:UserID"`
}

type CartItem struct {
	gorm.Model
	UserID    uint      `json:"userId" gorm:"index"`
	ProductID uint      `json:"productId" gorm:"index"`
	Quantity  int       `gorm:"not null;default:1" json:"quantity"`
	Product   Product   `json:"product" gorm:"foreignKey:ProductID"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
