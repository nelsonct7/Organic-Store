var id_lang = 1;
var poscompare = {
  nbProducts: 0,
  IdProducts: null,
};
var possearch_image = 1;
var possearch_number = 10;
var prestashop = {
  cart: {
    products: [],
    totals: {
      total: {
        type: "total",
        label: "Total",
        amount: 0,
        value: "$0.00",
      },
      total_including_tax: {
        type: "total",
        label: "Total (tax incl.)",
        amount: 0,
        value: "$0.00",
      },
      total_excluding_tax: {
        type: "total",
        label: "Total (tax excl.)",
        amount: 0,
        value: "$0.00",
      },
    },
    subtotals: {
      products: {
        type: "products",
        label: "Subtotal",
        amount: 0,
        value: "$0.00",
      },
      discounts: null,
      shipping: {
        type: "shipping",
        label: "Shipping",
        amount: 0,
        value: "Free",
      },
      tax: {
        type: "tax",
        label: "Taxes",
        amount: 0,
        value: "$0.00",
      },
    },
    products_count: 0,
    summary_string: "0 items",
    vouchers: {
      allowed: 0,
      added: [],
    },
    discounts: [],
    minimalPurchase: 0,
    minimalPurchaseRequired: "",
  },
  currency: {
    name: "US Dollar",
    iso_code: "USD",
    iso_code_num: "840",
    sign: "$",
  },
  customer: {
    lastname: null,
    firstname: null,
    email: null,
    birthday: null,
    newsletter: null,
    newsletter_date_add: null,
    optin: null,
    website: null,
    company: null,
    siret: null,
    ape: null,
    is_logged: false,
    gender: {
      type: null,
      name: null,
    },
    addresses: [],
  },
  language: {
    name: "English (English)",
    iso_code: "en",
    locale: "en-US",
    language_code: "en-us",
    is_rtl: "0",
    date_format_lite: "m/d/Y",
    date_format_full: "m/d/Y H:i:s",
    id: 1,
  },
  page: {
    title: "",
    canonical: null,
    meta: {
      title: "Ecolife  Responsive Prestashop Theme",
      description: "Shop powered by PrestaShop",
      keywords: "",
      robots: "index",
    },
    page_name: "index",
    body_classes: {
      "lang-en": true,
      "lang-rtl": false,
      "country-US": true,
      "currency-USD": true,
      "layout-full-width": true,
      "page-index": true,
      "tax-display-disabled": true,
    },
    admin_notifications: [],
  },
  shop: {
    name: "Ecolife  Responsive Prestashop Theme",
    logo: "/pos_ecolife/img/ecolife-responsive-prestashop-theme-logo-1580528177.jpg",
    stores_icon: "/pos_ecolife/img/logo_stores.png",
    favicon: "/pos_ecolife/img/favicon.ico",
  },
  urls: {
    base_url: "http://demo.posthemes.com/pos_ecolife/",
    current_url: "http://demo.posthemes.com/pos_ecolife/en/",
    shop_domain_url: "http://demo.posthemes.com",
    img_ps_url: "http://demo.posthemes.com/pos_ecolife/img/",
    img_cat_url: "http://demo.posthemes.com/pos_ecolife/img/c/",
    img_lang_url: "http://demo.posthemes.com/pos_ecolife/img/l/",
    img_prod_url: "http://demo.posthemes.com/pos_ecolife/img/p/",
    img_manu_url: "http://demo.posthemes.com/pos_ecolife/img/m/",
    img_sup_url: "http://demo.posthemes.com/pos_ecolife/img/su/",
    img_ship_url: "http://demo.posthemes.com/pos_ecolife/img/s/",
    img_store_url: "http://demo.posthemes.com/pos_ecolife/img/st/",
    img_col_url: "http://demo.posthemes.com/pos_ecolife/img/co/",
    img_url:
      "http://demo.posthemes.com/pos_ecolife/themes/theme_ecolife1/assets/img/",
    css_url:
      "http://demo.posthemes.com/pos_ecolife/themes/theme_ecolife1/assets/css/",
    js_url:
      "http://demo.posthemes.com/pos_ecolife/themes/theme_ecolife1/assets/js/",
    pic_url: "http://demo.posthemes.com/pos_ecolife/upload/",
    pages: {
      address: "http://demo.posthemes.com/pos_ecolife/en/address",
      addresses: "http://demo.posthemes.com/pos_ecolife/en/addresses",
      authentication: "http://demo.posthemes.com/pos_ecolife/en/login",
      cart: "http://demo.posthemes.com/pos_ecolife/en/cart",
      category:
        "http://demo.posthemes.com/pos_ecolife/en/index.php?controller=category",
      cms: "http://demo.posthemes.com/pos_ecolife/en/index.php?controller=cms",
      contact: "http://demo.posthemes.com/pos_ecolife/en/contact-us",
      discount: "http://demo.posthemes.com/pos_ecolife/en/discount",
      guest_tracking: "http://demo.posthemes.com/pos_ecolife/en/guest-tracking",
      history: "http://demo.posthemes.com/pos_ecolife/en/order-history",
      identity: "http://demo.posthemes.com/pos_ecolife/en/identity",
      index: "http://demo.posthemes.com/pos_ecolife/en/",
      my_account: "http://demo.posthemes.com/pos_ecolife/en/my-account",
      order_confirmation:
        "http://demo.posthemes.com/pos_ecolife/en/order-confirmation",
      order_detail:
        "http://demo.posthemes.com/pos_ecolife/en/index.php?controller=order-detail",
      order_follow: "http://demo.posthemes.com/pos_ecolife/en/order-follow",
      order: "http://demo.posthemes.com/pos_ecolife/en/order",
      order_return:
        "http://demo.posthemes.com/pos_ecolife/en/index.php?controller=order-return",
      order_slip: "http://demo.posthemes.com/pos_ecolife/en/credit-slip",
      pagenotfound: "http://demo.posthemes.com/pos_ecolife/en/page-not-found",
      password: "http://demo.posthemes.com/pos_ecolife/en/password-recovery",
      pdf_invoice:
        "http://demo.posthemes.com/pos_ecolife/en/index.php?controller=pdf-invoice",
      pdf_order_return:
        "http://demo.posthemes.com/pos_ecolife/en/index.php?controller=pdf-order-return",
      pdf_order_slip:
        "http://demo.posthemes.com/pos_ecolife/en/index.php?controller=pdf-order-slip",
      prices_drop: "http://demo.posthemes.com/pos_ecolife/en/prices-drop",
      product:
        "http://demo.posthemes.com/pos_ecolife/en/index.php?controller=product",
      search: "http://demo.posthemes.com/pos_ecolife/en/search",
      sitemap: "http://demo.posthemes.com/pos_ecolife/en/sitemap",
      stores: "http://demo.posthemes.com/pos_ecolife/en/stores",
      supplier: "http://demo.posthemes.com/pos_ecolife/en/supplier",
      register:
        "http://demo.posthemes.com/pos_ecolife/en/login?create_account=1",
      order_login: "http://demo.posthemes.com/pos_ecolife/en/order?login=1",
    },
    alternative_langs: {
      "en-us": "http://demo.posthemes.com/pos_ecolife/en/",
      "fr-fr": "http://demo.posthemes.com/pos_ecolife/fr/",
    },
    theme_assets: "/pos_ecolife/themes/theme_ecolife1/assets/",
    actions: {
      logout: "http://demo.posthemes.com/pos_ecolife/en/?mylogout=",
    },
    no_picture_image: {
      bySize: {
        small_default: {
          url: "http://demo.posthemes.com/pos_ecolife/img/p/en-default-small_default.jpg",
          width: 98,
          height: 98,
        },
        cart_default: {
          url: "http://demo.posthemes.com/pos_ecolife/img/p/en-default-cart_default.jpg",
          width: 125,
          height: 125,
        },
        home_default: {
          url: "http://demo.posthemes.com/pos_ecolife/img/p/en-default-home_default.jpg",
          width: 360,
          height: 360,
        },
        medium_default: {
          url: "http://demo.posthemes.com/pos_ecolife/img/p/en-default-medium_default.jpg",
          width: 452,
          height: 452,
        },
        large_default: {
          url: "http://demo.posthemes.com/pos_ecolife/img/p/en-default-large_default.jpg",
          width: 800,
          height: 800,
        },
      },
      small: {
        url: "http://demo.posthemes.com/pos_ecolife/img/p/en-default-small_default.jpg",
        width: 98,
        height: 98,
      },
      medium: {
        url: "http://demo.posthemes.com/pos_ecolife/img/p/en-default-home_default.jpg",
        width: 360,
        height: 360,
      },
      large: {
        url: "http://demo.posthemes.com/pos_ecolife/img/p/en-default-large_default.jpg",
        width: 800,
        height: 800,
      },
      legend: "",
    },
  },
  configuration: {
    display_taxes_label: false,
    display_prices_tax_incl: false,
    is_catalog: false,
    show_prices: true,
    opt_in: {
      partner: true,
    },
    quantity_discount: {
      type: "discount",
      label: "Discount",
    },
    voucher_enabled: 0,
    return_enabled: 0,
  },
  field_required: [],
  breadcrumb: {
    links: [
      {
        title: "Home",
        url: "http://demo.posthemes.com/pos_ecolife/en/",
      },
    ],
    count: 1,
  },
  link: {
    protocol_link: "http://",
    protocol_content: "http://",
  },
  time: 1652157151,
  static_token: "203b2fb46b107eabda9dd64ae8ebc173",
  token: "cdffaeea95d5ed44c00969a18ddb3a29",
};
var xip_base_dir = "index.html//demo.posthemes.com/pos_ecolife/";
