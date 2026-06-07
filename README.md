# Organic Store 🌿🛒

A production-grade e-commerce platform for fresh fruits, vegetables, and organic groceries. Built with **Node.js, Express, MongoDB (Mongoose), and Handlebars (HBS)** — featuring server-side rendering, role-based admin dashboard, Google OAuth, phone OTP verification, Razorpay payments, automated invoice generation, PDF/Excel reporting, and a complete order-to-delivery lifecycle.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js >= 18 |
| **Framework** | Express.js 4 |
| **Database** | MongoDB 7+ with Mongoose ODM 9 |
| **Templating** | Handlebars (HBS) via express-handlebars |
| **Auth** | Session-based, Passport.js (Google OAuth 2.0) |
| **OTP** | Twilio Verify v2 API |
| **Payments** | Razorpay (with HMAC signature verification), COD |
| **Email** | Nodemailer (SMTP — Gmail / Brevo) |
| **PDF** | pdf-creator-node (puppeteer) |
| **Excel** | xlsx (SheetJS) |
| **Image Hosting** | Cloudinary (multer-storage-cloudinary) |
| **Validation** | express-validator |
| **File Upload** | Multer (Cloudinary adapter) |
| **Security** | Helmet (CSP), express-rate-limit, CORS |
| **Admin UI** | Argon Dashboard (Bootstrap 5) with custom green branding |

---

## Architecture

The application follows a **layered MVC architecture** with a dedicated service layer:

```
┌──────────────┐     ┌──────────────┐     ┌────────────────┐     ┌─────────────┐
│   Browser /  │────▶│   Express    │────▶│   Controllers  │────▶│   Services  │
│   AJAX       │◀────│   Middleware │◀────│   (req/res)    │◀────│  (Business  │
│              │     │              │     │                │     │   Logic)    │
└──────────────┘     └──────────────┘     └────────────────┘     └──────┬──────┘
         │                     │                                        │
         │              ┌──────┴──────┐                          ┌──────┴──────┐
         │              │  Handlebars │                          │  Mongoose   │
         │              │  Templates  │                          │  Models     │
         │              └─────────────┘                          └─────────────┘
         │                                                              │
         │                                                       ┌──────┴──────┐
         │                                                       │  MongoDB    │
         │                                                       └─────────────┘
         │
    ┌────┴──────────────────────────────────────────────────────────────────────┐
    │  Middleware Pipeline: Helmet → CORS → BodyParser → Session → Flash →      │
    │  Passport → dataInjectMiddleware → RateLimiter → Routes → 404 → Error     │
    └───────────────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**
- **Service layer** handles all business logic; controllers only orchestrate request/response
- **Mongoose models** validate data at the database layer; services transform between Mongoose (camelCase) and legacy Handlebars template fields (hyphenated)
- **Session-based flash messaging** (no `connect-flash` package) — middleware in `server.js`
- **Common data middleware** injects categories, user info, cart count, wishlist count, and wallet balance into all templates via `res.locals`
- **Pagination utility** (`shared/utils/pagination.util.js`) reused across all list views
- **XHR form handlers** detect validation-error redirects via `xhr.responseURL` / `xhr.status`
- **Transactions** used for order creation (requires MongoDB replica set)
- **Cloudinary** for image storage with automatic CDN delivery and optimization; full URLs stored in database

---

## Features

### 🛍️ Product Browsing & Discovery
- **Categorized catalog** — hierarchical categories (parent → subcategory) with dedicated product pages
- **Search with AJAX dropdown** — real-time product search (results appear on typing 2+ characters)
- **Image zoom** — pure JavaScript magnifier lens on product detail view
- **All-products page** — paginated listing (`/products`) for browsing the full catalog
- **Landing page** — hero banner with carousel, category grid, featured product cards, newsletter signup

### 💰 Smart Pricing & Offers
- **Multi-unit pricing** — products sold by grams, ml, or count (e.g., 250g / 500g / 1kg, 1L, 6 pcs)
- **Offer engine** — product-level and category-level offers with priority-based resolution
- **Best-offer auto-apply** — highest priority wins; if tie, biggest discount value; no stacking
- **Strikethrough pricing** — original and discounted prices shown on product cards and detail page
- **Proportional pricing** — fractional units priced proportionally (e.g., 250g = basePrice ÷ 4)

### 🛒 Cart & Checkout
- **Full cart CRUD** — add, update quantity, change units, remove items with real-time pricing
- **Coupon system** — apply/remove discount coupons on cart page with live total recalculation
- **Offer re-resolution** — offers re-evaluated on quantity changes using current product/category offers
- **Address management** — add/edit/delete addresses with pincode validation during checkout
- **Mobile OTP verification** — phone verified via Twilio Verify v2 before payment
- **Delivery charge calculation** — free delivery for orders ≥ ₹299, otherwise ₹40
- **Pincode serviceability check** — validates delivery area (Thrissur-region pincodes) at address entry and order placement
- **Wallet integration** — view wallet balance, optionally use wallet funds toward payment
- **Razorpay payments** — HMAC-signed payment flow with server-side verification
- **Cash on Delivery (COD)** — order placed with stock reservation in MongoDB transaction

### 👤 User Account & Profile
- **Profile management** — view and update personal details
- **Mobile number editing** — update mobile number with SweetAlert2 modal; triggers re-verification
- **Address book** — save multiple addresses, set default, edit or delete via AJAX modals
- **Order history** — paginated list of past orders with product names, amounts, offer/coupon discounts
- **Order cancellation** — cancel placed orders with automatic stock restoration (AJAX + SweetAlert2)
- **Invoice download** — downloadable PDF invoice per order with Organic Store branding
- **Email invoice** — send invoice as PDF attachment via SMTP
- **Return/Refund requests** — request return within 5-day delivery window; admin approves/rejects/refunds

### ⭐ Reviews & Feedback
- **Product reviews** — submit, edit, and delete reviews (one per user per product)
- **Star ratings** — 1–5 rating with visual summary (average, count per star)
- **Admin moderation** — approve or hide reviews from admin panel
- **Feedback system** — structured feedback form (general / complaint / suggestion with rating and subject)
- **Admin feedback management** — update status, add admin notes, delete feedback

### 💬 Messaging
- **Conversation threads** — user initiates with subject, admin replies in-thread
- **Unread indicators** — header shows unread message count (user)
- **Admin inbox** — search, filter, reply, close, and delete conversations

### 💳 Wallet
- **Digital wallet** — each user has a wallet with credit/debit transaction history
- **Transactions** — every credit (refund, top-up) and debit (order payment) recorded with balance snapshots
- **Dedicated wallet page** — `/wallet` shows current balance and full transaction history (newest first)
- **Header balance display** — wallet balance shown in header bar and account dropdown
- **Checkout integration** — optional wallet usage at checkout; debited during order creation

### ❤️ Wishlist
- **Toggle wishlist** — add/remove products with AJAX from any product card or detail page
- **Count badge** — dynamic wishlist count in header
- **Dedicated wishlist page** — `/wishlist` shows all saved products in a grid
- **Wishlist check API** — `GET /api/wishlist/check/:id` returns boolean for UI state

### 🔐 Authentication
- **Email/password registration** — with bcrypt hashing and mobile uniqueness check
- **Google OAuth 2.0** — one-click login via Passport.js
- **Smart auth routing** — logged-in users redirected away from login/register pages
- **Auth provider guard** — Google-only users cannot log in with password; local users cannot log in with Google
- **Flash messaging** — success/error messages on auth forms (wrong credentials, duplicate email/mobile)
- **Session-based auth** — `req.session.userId` with backward-compatible session user data

### 🔧 Admin Dashboard
- **Dashboard analytics** — revenue charts, order statistics, top-selling products
- **Product management** — full CRUD with Cloudinary image upload (multiple images), auto-generated availableUnits and stockIn from metrics
- **Category management** — parent-child hierarchy, subcategory support, image upload, case-insensitive name uniqueness enforcement
- **Offer engine** — create product-level and category-level offers with priority and discount value/percentage
- **Coupon management** — create and manage discount coupons
- **Order lifecycle** — view all orders, mark as **shipped** (dispatchOrder) and **delivered** (deliverOrder); delivered orders become read-only
- **User management** — view/add/soft-delete users; admin users protected from deletion
- **Review moderation** — approve/hide product reviews with paginated per-product view
- **Feedback inbox** — manage user feedback with status (pending/in-review/resolved) and admin notes
- **Message inbox** — reply to user conversations, close/delete threads with search and pagination
- **Banner management** — homepage hero banner carousel (add/delete)
- **Sales reports** — yearly, monthly, daily, and custom date-range reports with PDF and Excel export
- **PDF export** — branded sales reports (green palette, Organic Store logo) with per-order and per-item breakdown
- **Excel export** — sales data in XLSX format (SheetJS)

### 📬 Communication & Automation
- **Invoice PDF** — downloadable per-order invoice with item-level breakdown and branded header
- **Email invoices** — send invoice as PDF attachment via configurable SMTP (Nodemailer)
- **Sales reports** — PDF/Excel export with green-branded templates
- **Newsletter** — email subscription collection on homepage
- **Flash notifications** — session-based success/error messages across all pages

### 🛡️ Security
- **Helmet CSP** — strict Content Security Policy with CDN allowlist (Google APIs, jsDelivr, Font Awesome, Razorpay, DataTables, cdnjs, Cloudinary)
- **Rate limiting** — auth endpoints limited to prevent brute-force
- **Input validation** — express-validator on all POST routes
- **MongoDB injection prevention** — Mongoose schema validation
- **Session security** — `saveUninitialized: false`, cookie-based sessions
- **HMAC verification** — Razorpay payment signature verified server-side
- **HMAC secret** — Razorpay secret never exposed to client
- **Error handling** — global error handler renders consistent error pages (403, 404, 500 standalone)

---

## Directory Structure

```
├── app.js                    # Entry point — creates HTTP server
├── server.js                 # Express app factory — middleware, routes, helpers
├── config/
│   ├── env.config.js         # Centralized env variable access (no process.env)
│   ├── db.config.js          # MongoDB connection via Mongoose
│   ├── passport.config.js    # Google OAuth strategy (Passport.js)
│   ├── cloudinary.config.js  # Cloudinary SDK config
│   └── constants.config.js   # App-wide constants (delivery charge, pincodes, metrics)
├── collections/              # Mongoose models
│   ├── user.collection.js
│   ├── product.collection.js
│   ├── category.collection.js
│   ├── cart.collection.js
│   ├── cart-item.collection.js
│   ├── order.collection.js
│   ├── order-item.collection.js
│   ├── offer.collection.js
│   ├── review.collection.js
│   ├── feedback.collection.js
│   ├── message.collection.js
│   ├── wallet.collection.js
│   ├── wishlist.collection.js
│   ├── return.collection.js
│   ├── banner.collection.js
│   ├── roles.collection.js
│   └── user.address.collection.js
├── controllers/              # Request handlers
│   ├── admin.controller.js
│   ├── base.controller.js
│   ├── auth.controller.js
│   ├── cart.controller.js
│   ├── checkout.controller.js
│   ├── order.controller.js
│   ├── review.controller.js
│   ├── feedback.controller.js
│   ├── message.controller.js
│   ├── invoice.controller.js
│   ├── report.controller.js
│   └── wallet.controller.js
├── services/                 # Business logic
│   ├── admin.service.js
│   ├── auth.service.js
│   ├── cart.service.js
│   ├── checkout.service.js
│   ├── pricing.service.js
│   ├── inventory.service.js
│   ├── address.service.js
│   ├── review.service.js
│   ├── feedback.service.js
│   ├── message.service.js
│   ├── invoice.service.js
│   ├── email.service.js
│   ├── report.service.js
│   ├── wallet.service.js
│   ├── wishlist.service.js
│   └── razorpay.service.js
├── routes/                   # Express routers
│   ├── base.routes.js        # Public pages (home, products, about, wallet, etc.)
│   ├── auth.routes.js        # Login/register
│   ├── google.auth.routes.js # Google OAuth callback
│   ├── admin.routes.js       # Admin CRUD + dashboard
│   ├── cart.routes.js        # Cart API + coupons
│   ├── checkout.routes.js    # Checkout flow (address, OTP, payment)
│   ├── order.routes.js       # Order API
│   ├── review.routes.js      # Reviews API
│   ├── wishlist.routes.js    # Wishlist API
│   ├── return.routes.js      # Return/refund API
│   ├── invoice.routes.js     # Invoice download/email
│   └── error.routes.js       # Error pages
├── middlewares/
│   ├── auth.middleware.js     # Session/role guard
│   ├── data-inject.middleware.js  # Common template data (categories, cart, wallet, wishlist)
│   ├── multer.middleware.js   # File upload configs (Cloudinary adapter)
│   ├── ratelimit.middleware.js    # Rate limiting
│   └── error.middleware.js    # Global error handler
├── shared/
│   ├── utils/
│   │   ├── env.utils.js       # Env variable getters
│   │   ├── mongo.utils.js     # MongoDB helpers
│   │   ├── otp.utils.js       # Twilio OTP (E.164 normalization)
│   │   ├── pincode.utils.js   # Pincode serviceability check
│   │   ├── pagination.util.js # Reusable paginate()
│   │   ├── error.util.js      # Custom error classes
│   │   └── validation.utils.js # buildValidationChains, validationMiddleware
│   └── validators/
│       ├── auth.validator.js   # Auth validation schemas
│       └── admin.validator.js  # Admin validation schemas
├── views/
│   ├── layouts/
│   │   ├── layout.hbs          # Main layout (public + admin)
│   │   └── authLayout.hbs      # Login/register layout
│   ├── base/                   # Public page templates
│   │   ├── index.hbs           # Homepage
│   │   ├── all-products.hbs    # Paginated product listing
│   │   ├── category-products.hbs
│   │   ├── orders.hbs          # User order history
│   │   ├── profile.hbs         # Profile with address management
│   │   ├── wishlist.hbs        # Wishlist grid
│   │   ├── wallet.hbs          # Wallet balance + transactions
│   │   ├── return.hbs          # Return request form
│   │   ├── messages.hbs        # User messages
│   │   ├── feedback.hbs        # Feedback form
│   │   ├── about-us.hbs
│   │   └── privacy-terms.hbs
│   ├── admin/                  # Admin panel templates
│   ├── auth/                   # Login/register templates
│   ├── cart/                   # Cart & checkout templates
│   ├── errors/                 # 403, 404, 500 error templates
│   ├── products/               # Product view templates
│   └── partials/               # Reusable partials (header, footer, sidebar, pagination)
├── public/                     # Static assets
│   ├── assets/                 # Argon Dashboard theme
│   ├── stylesheets/            # Custom CSS (admin-theme, main-theme, auth, err403)
│   ├── javascripts/            # Client-side JS
│   ├── banner-images/          # Uploaded banner images
│   ├── category-images/        # Uploaded category images
│   └── product-images/         # Uploaded product images
├── scripts/
│   └── seed-admin.js           # CLI seed script (npm run seed)
├── .env-example                # Environment variable template
└── package.json
```

---

## Environment Variables

Create a `.env` file in the project root (see `.env-example`):

```env
# Server
PORT=3000
MONGO_URI=mongodb://localhost:27017/org_store
SESSION_SECRET=your-session-secret
JWT_SECRET=your-jwt-secret-key
CORS_ORIGIN=*

# Razorpay (payments)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Twilio (phone OTP verification)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_SERVICE_SID=your-twilio-service-sid

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Cloudinary (image hosting)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (SMTP) — for sending invoice PDFs
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
APP_URL=http://localhost:3000
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm**
- **MongoDB** >= 7 (local or Atlas) — replica set required for transactions
- **Twilio account** (for OTP verification)
- **Razorpay account** (for payment processing)
- **Google OAuth credentials** (for social login)
- **Cloudinary account** (free tier — 25 GB storage + CDN)

### Installation

```bash
# Clone the repository
git clone https://github.com/nelsonct7/Organic-Store.git
cd Organic-Store

# Install dependencies
npm install

# Create environment config
cp .env-example .env
# Edit .env with your credentials

# Seed admin user
npm run seed

# Start the server
npm start
```

Visit **http://localhost:3000** — the server renders the homepage with product catalog.

### Development

```bash
npm run dev   # Runs with nodemon for auto-reload
```

---

## API Endpoints

### Public Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Homepage |
| GET | `/products` | All products (paginated) |
| GET | `/category/:id` | Products by category |
| GET | `/view-product/:id` | Product detail with reviews + wishlist toggle |
| GET | `/api/search` | AJAX product search |
| GET | `/about-us` | About page |
| GET | `/feedback` | Feedback form |
| GET | `/messages` | User messages |
| GET | `/wallet` | Wallet balance + transaction history |
| GET | `/wishlist` | Wishlist page |
| GET | `/orders` | User order list |
| GET | `/view-profile` | Profile with address management |

### Auth Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/auth/login` | Login page |
| POST | `/v1/auth/login` | Login action |
| GET | `/v1/auth/register` | Register page |
| POST | `/v1/auth/register` | Register action |
| GET | `/auth/google` | Google OAuth login |
| GET | `/auth/google/callback` | Google OAuth callback |
| GET | `/logout` | Logout |

### Cart API
| Method | Path | Description |
|--------|------|-------------|
| GET | `/cart` | View cart page |
| POST | `/cart/items` | Add item to cart |
| PATCH | `/cart/items/:id` | Update cart item |
| DELETE | `/cart/items/:id` | Remove cart item |
| POST | `/cart/coupon` | Apply coupon to cart |
| DELETE | `/cart/coupon` | Remove coupon from cart |

### Checkout API
| Method | Path | Description |
|--------|------|-------------|
| GET | `/checkout` | Checkout page |
| POST | `/checkout/address` | Add address |
| POST | `/checkout/send-otp` | Send OTP |
| POST | `/checkout/verify-otp` | Verify OTP |
| POST | `/checkout/order/cod` | Place COD order |
| POST | `/checkout/order/razorpay` | Create Razorpay order |
| POST | `/checkout/verify-razorpay` | Verify Razorpay payment |

### Order API
| Method | Path | Description |
|--------|------|-------------|
| GET | `/orders` | User order list |
| GET | `/orders/:id` | Order detail |
| PATCH | `/orders/:id/cancel` | Cancel order |
| GET | `/orders/:id/invoice` | Download invoice PDF |
| POST | `/orders/:id/invoice/email` | Email invoice |
| GET | `/orders/:id/return` | Return request form |
| POST | `/orders/:id/return` | Submit return request |

### Review API
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/review` | Submit review |
| GET | `/api/reviews/:productId` | Product reviews |
| GET | `/api/my-reviews` | User's reviews |
| PUT | `/api/my-reviews/:id` | Update review |
| DELETE | `/api/my-reviews/:id` | Delete review |

### Wishlist API
| Method | Path | Description |
|--------|------|-------------|
| GET | `/wishlist` | View wishlist page |
| POST | `/wishlist/toggle/:id` | Toggle product in wishlist |
| GET | `/api/wishlist/check/:id` | Check if product is in wishlist |

### Profile API
| Method | Path | Description |
|--------|------|-------------|
| PUT | `/profile/mobile` | Update mobile number |
| POST | `/profile/address` | Add new address |
| PUT | `/profile/address/:id` | Update address |
| DELETE | `/profile/address/:id` | Delete address |

### Admin Routes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin` | Admin login |
| POST | `/admin/login` | Admin login action |
| GET | `/admin/home` | Dashboard |
| GET | `/admin/view-products` | Product list (paginated) |
| POST | `/admin/add-products` | Add product |
| POST | `/admin/edit-products/:id` | Edit product |
| DELETE | `/admin/delete-product/:id` | Delete product |
| POST | `/admin/delete-product-image` | Delete product image |
| GET | `/admin/view-users` | User management |
| POST | `/admin/add-users` | Add user |
| GET | `/admin/view-category` | Category management |
| POST | `/admin/add-category` | Add category |
| POST | `/admin/edit-category/:id` | Edit category |
| DELETE | `/admin/delete-category/:id` | Delete category |
| GET | `/admin/view-orders` | Order management |
| POST | `/admin/update-order` | Update order (ship/deliver/delete) |
| GET | `/admin/view-reports` | Sales reports |
| GET | `/admin/reports/pdf` | Download PDF report |
| GET | `/admin/reports/excel` | Download Excel report |
| GET | `/admin/view-reviews` | Review moderation |
| GET | `/admin/reviews/:productId` | Per-product review management |
| POST | `/admin/review/toggle-approval/:id` | Approve/hide review |
| GET | `/admin/view-feedback` | Feedback management |
| GET | `/admin/view-message` | Message inbox |
| GET | `/admin/view-returns` | Return/refund management |
| GET | `/admin/add-offer` | Offer creation |

---

## Database Models

| Model | Collection | Key Fields |
|-------|-----------|------------|
| **User** | `og_users` | name, email, mobile, password, googleId, authProvider, role, addresses[], isMobileVerified |
| **Product** | `og_products` | name, category, description, basePrice, images[{id, url}], availableUnits[{metric, measure}], stockIn, offers[], isActive |
| **Category** | `og_category` | name, description, image, isSubCategory, parentCategory, offers[], isActive |
| **Cart** | `og_carts` | userId, items[{productId, quantity, selectedUnit, unitPrice, finalUnitPrice, subtotal}], totalAmount, totalDiscount, finalAmount, appliedCoupon |
| **Order** | `og_orders` | userId, items[{orderItemId, quantity}], address, paymentMethod, razorpayOrderId, razorpayPaymentId, totalAmount, offerDiscount, couponDiscount, grandTotal, deliveryCharge, walletUsed, walletAmount, status |
| **OrderItem** | `og_order_items` | productId, name, quantity, price, subtotal, selectedUnit |
| **Offer** | `og_offers` | name, type (percentage/flat), value, appliedTo (product/category/subcategory), priority, active |
| **Review** | `og_reviews` | productId, userId, rating (1-5), comment, isApproved |
| **Wallet** | `wallet` | userId, balance, transactions[{type, amount, balanceBefore, balanceAfter, description, reference}] |
| **Wishlist** | `wishlist` | userId, products[] (ObjectId refs) |
| **Return** | `returns` | orderId, userId, items[], reason, status (requested/approved/rejected/refunded), refundAmount |
| **UserFeedback** | `user_feedback` | userId, type (general/complaint/suggestion), productId, rating, subject, message, status, adminNote |
| **UserMessage** | `user_messages` | userId, subject, messages[{sender, text, timestamp}], status (open/closed) |
| **Banner** | `og_banners` | title, image, link, active |
| **Roles** | `og_roles` | name (admin/user) |
| **Address** | `user_addresses` | userId, fullName, mobile, pincode, address, locality, city, state, isDefault |

---

## Authentication & Authorization

### Session-Based Auth
- Login creates a session with `userId` stored in `req.session`
- Auth middleware checks `req.session.userId` on protected routes
- Admin routes use `validateAdminAccess` middleware (role check + session)
- Common data middleware injects `sessionUser`, `cartCount`, `walletBalance`, `wishlistCount` into all templates

### Password Auth
- Passwords hashed with **bcrypt** (cost factor 10)
- Login validates credentials and checks `authProvider` — Google-only users cannot log in with password

### Google OAuth
- Passport.js with Google OAuth 2.0 strategy
- Creates user if new email; logs in if existing Google user
- Blocks login if email is locally registered (different `authProvider`)

### Mobile OTP (Twilio Verify v2)
- Phone numbers normalized to E.164 format (`+91xxxxxxxxxx`)
- OTP sent via Twilio Verify service
- Successful verification sets `User.isMobileVerified = true`
- Used during checkout and mobile number updates

---

## Payment & Checkout Flow

### Checkout Process
1. User clicks "Proceed to Checkout" from cart
2. Selects or adds a delivery address (pincode validated)
3. Verifies mobile number via OTP
4. Optionally checks "Use Wallet" to apply wallet balance
5. Chooses payment method (COD or Razorpay)

### Cash on Delivery (COD)
1. POST `/checkout/order/cod` — creates order within MongoDB transaction
2. Delivery charge calculated (free if grandTotal ≥ ₹299, else ₹40)
3. Wallet debited if opted
4. Stock is reserved atomically
5. Pincode re-validated at order creation

### Razorpay
1. POST `/checkout/order/razorpay` — creates Razorpay order, returns `orderId`
2. Razorpay Checkout opens in browser
3. On success, POST `/checkout/verify-razorpay` — verifies HMAC SHA256 signature
4. Delivery charge and wallet handled same as COD
5. Stock reserved only after payment verification

### Offer Resolution (PricingService)
1. Collect all active offers for product, its subcategory, and parent category
2. Sort by priority (descending) then discount value (descending)
3. Apply only the best offer — no stacking
4. Proportional pricing for fractional units (e.g., 250g = basePrice ÷ 4)
5. Offers re-resolved on cart quantity changes

### Delivery Charge
- Free delivery for orders with grandTotal ≥ ₹299
- Otherwise flat ₹40 delivery charge
- Applied after coupon discount, before grand total
- Stored as `deliveryCharge` on Order document

---

## Admin Panel

The admin area is mounted at `/admin` and uses **Argon Dashboard** (Bootstrap 5) with a custom green organic color palette (`admin-theme.css`).

**Access:** Visit `/admin`, log in with the admin credentials created by `npm run seed`.

**Capabilities:**
- Dashboard with revenue charts, order stats, top products
- Full CRUD for products (multi-image Cloudinary upload), categories (parent-child hierarchy), users, banners, coupons
- Offer engine with priority-based resolution (product + category level)
- Order lifecycle management (placed → shipped → delivered); delivered orders are read-only
- Review approval/moderation with per-product paginated view
- Feedback management with status tracking and admin notes
- User-to-admin messaging with reply/close/delete
- Sales reports (yearly/monthly/daily/custom) with PDF and Excel export
- Return/refund management (approve, reject, refund to wallet)
- Role-based access control

---

## Security

- **Helmet CSP** — strict Content Security Policy with CDN allowlist (Google APIs, jsDelivr, Font Awesome, Razorpay, DataTables, cdnjs, Cloudinary)
- **Rate limiting** — auth endpoints limited to prevent brute-force
- **CORS** — configurable origin with credentials
- **Input validation** — express-validator on all POST routes
- **MongoDB injection prevention** — Mongoose schema validation
- **Session security** — `saveUninitialized: false`, cookie-based sessions
- **HMAC verification** — Razorpay payment signature verified server-side
- **HMAC secret** — Razorpay secret never exposed to client
- **Cache control** — no-cache headers for unauthenticated users
- **Error handling** — global error handler renders consistent standalone error pages (403, 404, 500)
- **Image deletion** — Cloudinary public IDs extracted from URLs for secure server-side deletion

---

## Deployment

The application is ready for deployment on platforms like:
- **Render.com** (Node.js + Puppeteer/Chromium) + MongoDB Atlas
- **AWS EC2** with PM2 process manager
- **DigitalOcean** / **Vultr** VPS

For production:
1. Set `NODE_ENV=production`
2. Use a strong `SESSION_SECRET` and `JWT_SECRET`
3. Enable MongoDB replica set for transaction support
4. Configure real SMTP credentials for invoice email delivery
5. Set up Razorpay production keys
6. Configure Google OAuth with production callback URL
7. Set Cloudinary production environment
8. Update serviceable pincodes in `config/constants.config.js` for your region

---

## Testing

The project does not currently have automated tests. Manual testing covers:
- Product browsing and search with AJAX dropdown
- Cart CRUD with pricing recalculation and coupon application
- Full checkout flow (address selection → pincode validation → OTP → payment)
- Wallet display, transaction history, and checkout integration
- Wishlist toggle on product cards and detail page
- Order lifecycle (cancel, invoice download/email, return request)
- Admin CRUD operations with Cloudinary image upload/delete
- Offer resolution with priorities
- Review submission, editing, deletion, and moderation
- Feedback and messaging workflows
- Return/refund flow (request → admin approve → wallet refund)
- Profile address management (add/edit/delete) and mobile editing
- Admin report generation (PDF + Excel)

---

## License

Private project.
