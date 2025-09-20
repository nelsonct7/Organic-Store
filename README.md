# Organic Store 🌿🛒

A backend-driven e-commerce application for delivering fresh fruits and vegetables to customers. Built with **Node.js, Express, MongoDB, and Handlebars (HBS)** to support server-side rendering and real-world transaction workflows.

Developed entirely by me as the sole backend developer, this project demonstrates practical full-stack implementation in a production-like environment.

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|------------|
| **Backend** | Node.js, Express.js |
| **Templating** | Handlebars (HBS) – Server-Side Rendering |
| **Database** | MongoDB |
| **Authentication** | Session-based auth, Twilio OTP verification |
| **Payments** | COD, PayPal, RazorPay |
| **Deployment** | AWS EC2 |
| **Frontend Integration** | HTML, CSS, JavaScript, AJAX |

---

## 🧩 Features

✅ Product catalog management  
✅ User authentication with phone OTP (via **Twilio**)  
✅ Multiple payment options:
   - Cash on Delivery (COD)
   - [PayPal](https://www.paypal.com)
   - [RazorPay](https://razorpay.com)  
✅ Automated email receipts using **Nodemailer**  
✅ Admin dashboard with full control over:
   - Products
   - Orders
   - Purchases
   - Offers & categories  
✅ Responsive UI with server-rendered pages (no client-side React)  
✅ Secure session management and role-based access  

Ideal for small-to-medium local businesses looking to digitize their delivery operations.

---

## 🔧 Getting Started

### 1. Prerequisites
- Node.js (v16 or higher)
- npm
- MongoDB
- Environment variables (for API keys)

### 2. Clone the Repository
```bash
git clone https://github.com/nelsonct7/Organic-Store.git
cd Organic-Store
