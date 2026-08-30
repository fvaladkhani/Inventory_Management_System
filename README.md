# 🏭 Inventory Management System

A complete bilingual (Persian/English) inventory and order management system built with **Laravel** and **React**.


----


## 🌐 Live Demo

Try it out: [https://ism.adgserver.ir](https://ism.adgserver.ir)

**Demo credentials:**
- Username: `admin`
- Password: `admin`

> Developed by **Farzad** — Full-Stack Developer

---

## ✨ Key Features

### Product Management
- 📦 **Products**: Create, edit, delete, and search products
- 🏷️ **Categories**: Manage product categories
- 🎨 **Product Variants**: Define variants (size, color, model) with extra pricing
- 📦 **Product Bundles**: Create combo packages with discounts
- 🏷️ **Discounts**: Define time-based discounts for products

### Inventory Management
- 📋 **Stock**: Manage product inventory across different warehouses
- 📊 **Transaction History**: Full view of stock movements (in/out)
- ⚠️ **Low Stock Alerts**: Auto-display products with low inventory

### Orders
- 📥 **Purchase Orders**: Register and manage supplier orders
- 📤 **Sales Orders**: Register and manage customer orders
- 🔄 **Auto Stock Confirmation**: Inventory updates automatically after order confirmation
- 📌 **Order Tracking**: View order status change history

### CRM
- 👥 **Customers**: Manage customer information
- 🏢 **Suppliers**: Manage supplier information
- 📞 **Contact Management**: Manage contacts for each supplier

### Reports & Analytics
- 📊 **Advanced Dashboard**: Key metrics with interactive charts
- 📈 **Reports**: Inventory, sales, purchases, and analytics reports
- 📄 **PDF/Excel/CSV Export**: Export reports in multiple formats
- 🖨️ **Order Printing**: Print order invoices

### Users & Security
- 👤 **User Management**: Add, edit, and delete users
- 🔒 **Password Change**: Ability to change user passwords
- 🛡️ **Session-based Authentication**: Secure and simple

### System Settings
- ⚙️ **General Settings**: Company info, currency, timezone
- 📏 **Unit Settings**: Weight, dimension, volume units
- 🏚️ **Warehouse Settings**: Default warehouse, low stock threshold, auto-order
- 📧 **Email Settings**: SMTP configuration for sending emails

### Bilingual Support
- 🌍 **Persian & English Support**: Switch language instantly
- 🔄 **Full RTL Support**: Complete RTL for Persian language
- 📝 **Full Translation**: All system sections are translated

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Description |
|------------|---------|-------------|
| Laravel | 9.x | Main backend framework |
| PHP | 8.1+ | Programming language |
| SQLite | - | Default database (switchable to MySQL) |
| Laravel Sanctum | - | Session-based authentication |

### Frontend
| Technology | Version | Description |
|------------|---------|-------------|
| React | 18.x | Main frontend framework |
| React Router | 6.x | Route management |
| Bootstrap | 5.x | Styling library |
| Axios | - | HTTP requests |
| Recharts | - | Interactive charts |
| i18next | - | Bilingual support |
| jsPDF / html2pdf | - | PDF export |
| XLSX | - | Excel export |

---

## 📋 Prerequisites

| Prerequisite | Version | Description |
|--------------|---------|-------------|
| PHP | 8.1+ | With SQLite support |
| Composer | Latest | PHP package manager |
| Node.js | 18+ | JavaScript package manager |
| NPM | Latest | Install frontend dependencies |
| SQLite | - | Default database |

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/inventory-management-system.git
cd inventory-management-system
