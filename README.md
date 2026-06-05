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
| **Validation** | express-validator |
| **File Upload** | Multer |
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
- **Common data middleware** injects categories, user info, and cart count into all templates via `res.locals`
- **Pagination utility** (`shared/utils/pagination.util.js`) reused across all list views
- **XHR form handlers** detect validation-error redirects via `xhr.responseURL` / `xhr.status`
- **Transactions** used for order creation (requires MongoDB replica set)

---

## Features

### User Features
- **Product browsing** — categorized catalog with search, image zoom (pure JS magnifier)
- **Smart pricing** — offers resolved by priority + discount value (no stacking); strikethrough pricing display
- **Flexible units** — products sold by grams, ml, or count (e.g., 250g, 500g, 1kg, 1L, 6 pcs)
- **Cart management** — add/update/remove items, quantity controls, real-time pricing recalculation with offer application
- **Checkout flow** — address selection → mobile OTP verification (Twilio) → COD or Razorpay payment
- **Order management** — view order history, cancel orders with automatic stock restoration, download invoices
- **Product reviews** — submit, edit, and delete reviews (one per user per product); star ratings with summary
- **Feedback system** — submit structured feedback (type, rating, subject, message)
- **User-to-admin messaging** — conversation-thread messaging with admin replies
- **User profile** — update personal info, view order history, manage reviews
- **Wishlist** — add to cart functionality
- **Google OAuth** — one-click login with Google
- **Mobile OTP** — phone number verification via Twilio Verify v2

### Admin Dashboard
- **Product management** — add/edit/delete products with multiple image upload, auto-generated availableUnits and stockIn from metrics
- **Category management** — parent-child hierarchy, subcategories, image upload, name uniqueness enforcement
- **Offer engine** — create product-level and category-level offers with priority and discount value; automatic best-offer resolution
- **Coupon management** — create and manage discount coupons
- **Order management** — view all orders, update dispatch status
- **User management** — view/add/soft-delete users, role-based (admin/user)
- **Review moderation** — approve/hide product reviews
- **Feedback inbox** — manage user feedback with status/notes
- **Message inbox** — reply to user conversations, close/delete threads
- **Banner management** — homepage banner carousel management
- **Sales reports** — yearly, monthly, daily, and custom date-range reports
- **PDF export** — branded sales reports with per-order and per-item breakdown
- **Excel export** — sales data in XLSX format
- **Dashboard analytics** — revenue charts, order stats, top products

### Communication & Automation
- **Invoice PDF** — downloadable per-order invoice with Organic Store branding
- **Email invoices** — send invoice as PDF attachment via SMTP (Nodemailer)
- **Sales reports** — PDF/Excel export with green-branded templates
- **Newsletter** — email subscription collection
- **Flash notifications** — session-based success/error messages

---

## Directory Structure

```
├── app.js                    # Entry point — creates HTTP server
├── server.js                 # Express app factory — middleware, routes, helpers
├── config/
│   ├── env.config.js         # Centralized env variable access (no process.env)
│   ├── db.config.js          # MongoDB connection via Mongoose
│   ├── passport.config.js    # Google OAuth strategy (Passport.js)
│   └── constants.config.js   # App-wide constants
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
│   └── report.controller.js
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
│   └── report.service.js
├── routes/                   # Express routers
│   ├── base.routes.js        # Public pages (home, products, about, etc.)
│   ├── auth.routes.js        # Login/register
│   ├── google.auth.routes.js # Google OAuth callback
│   ├── admin.routes.js       # Admin CRUD + dashboard
│   ├── cart.routes.js        # Cart API
│   ├── checkout.routes.js    # Checkout flow
│   ├── order.routes.js       # Order API
│   ├── review.routes.js      # Reviews API
│   ├── invoice.routes.js     # Invoice download/email
│   └── error.routes.js       # Error pages
├── middlewares/
│   ├── auth.middleware.js     # Session/role guard
│   ├── data-inject.middleware.js  # Common template data
│   ├── multer.middleware.js   # File upload configs
│   ├── ratelimit.middleware.js    # Rate limiting
│   └── error.middleware.js    # Global error handler
├── shared/
│   ├── utils/
│   │   ├── env.utils.js       # Env variable getters
│   │   ├── mongo.utils.js     # MongoDB helpers
│   │   ├── otp.utils.js       # Twilio OTP (E.164 normalization)
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
- **MongoDB** >= 7 (local or Atlas)
- **Twilio account** (for OTP verification)
- **Razorpay account** (for payment processing)
- **Google OAuth credentials** (for social login)

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
| GET | `/view-product/:id` | Product detail with reviews |
| GET | `/api/search` | AJAX product search |
| GET | `/about-us` | About page |
| GET | `/feedback` | Feedback form |
| GET | `/messages` | User messages |

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

### Review API
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/review` | Submit review |
| GET | `/api/reviews/:productId` | Product reviews |
| GET | `/api/my-reviews` | User's reviews |
| PUT | `/api/my-reviews/:id` | Update review |
| DELETE | `/api/my-reviews/:id` | Delete review |

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
| GET | `/admin/view-users` | User management |
| GET | `/admin/view-orders` | Order management |
| POST | `/admin/dispatch-order/:id` | Update order status |
| GET | `/admin/view-reports` | Sales reports |
| GET | `/admin/reports/pdf` | Download PDF report |
| GET | `/admin/reports/excel` | Download Excel report |

---

## Database Models

| Model | Collection | Key Fields |
|-------|-----------|------------|
| **User** | `og_users` | name, email, mobile, password, googleId, authProvider, role, addresses[] |
| **Product** | `og_products` | name, category, description, basePrice, images[{id, url}], availableUnits[{metric, measure}], stockIn, offers[] |
| **Category** | `og_category` | name, description, image, isSubCategory, parentCategory, offers[] |
| **Cart** | `og_carts` | userId, items[{productId, quantity, selectedUnit, unitPrice, finalUnitPrice, subtotal}], totalAmount, totalDiscount, finalAmount |
| **Order** | `og_orders` | userId, items[{orderItemId, quantity}], address, paymentMethod, razorpayPaymentId, totalAmount, offerDiscount, couponDiscount, grandTotal, status |
| **OrderItem** | `og_order_items` | productId, name, quantity, price, subtotal, selectedUnit |
| **Offer** | `og_offers` | name, type (percentage/flat), value, appliedTo (product/category/subcategory), priority, active |
| **Review** | `og_reviews` | productId, userId, rating (1-5), comment, isApproved |
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

---

## Payment Flow

### Cash on Delivery (COD)
1. User selects address
2. OTP verification completes
3. POST `/checkout/order/cod` — creates order within MongoDB transaction
4. Stock is reserved atomically

### Razorpay
1. User selects address, completes OTP
2. POST `/checkout/order/razorpay` — creates Razorpay order, returns `orderId`
3. Razorpay Checkout opens in browser
4. On success, POST `/checkout/verify-razorpay` — verifies HMAC SHA256 signature
5. Stock is reserved only after payment verification

### Offer Resolution (PricingService)
1. Collect all active offers for product, its subcategory, and parent category
2. Sort by priority (descending) then discount value (descending)
3. Apply only the best offer — no stacking
4. Proportional pricing for fractional units (e.g., 250g = basePrice ÷ 4)

---

## Admin Panel

The admin area is mounted at `/admin` and uses **Argon Dashboard** (Bootstrap 5) with a custom green organic color palette (`admin-theme.css`).

**Access:** Visit `/admin`, log in with the admin credentials created by `npm run seed`.

**Capabilities:**
- Dashboard with revenue charts, order stats, top products
- Full CRUD for products, categories, users, banners, coupons
- Offer engine with priority-based resolution
- Order lifecycle management (placed → shipped → delivered)
- Review approval/moderation
- Feedback management with status tracking
- User-to-admin messaging with reply/close/delete
- Sales reports (yearly/monthly/daily/custom) with PDF and Excel export
- Role-based access control

---

## Security

- **Helmet CSP** — strict Content Security Policy with CDN allowlist (Google APIs, jsDelivr, Font Awesome, Razorpay, DataTables, cdnjs)
- **Rate limiting** — auth endpoints limited to prevent brute-force
- **CORS** — configurable origin with credentials
- **Input validation** — express-validator on all POST routes
- **MongoDB injection prevention** — Mongoose schema validation
- **Session security** — `saveUninitialized: false`, cookie-based sessions
- **HMAC verification** — Razorpay payment signature verified server-side
- **HMAC secret** — Razorpay secret never exposed to client
- **Cache control** — no-cache headers for unauthenticated users
- **Error handling** — global error handler renders consistent error pages (403, 404, 500)

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

---

## Testing

The project does not currently have automated tests. Manual testing covers:
- Product browsing and search
- Cart CRUD with pricing recalculation
- Full checkout flow (address → OTP → payment)
- Admin CRUD operations with image upload/delete
- Offer resolution with priorities
- Review submission and moderation
- Feedback and messaging workflows
- Invoice download and email
- Report generation (PDF + Excel)

---

## License

Private project.
