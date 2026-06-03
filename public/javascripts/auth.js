/* ========================================
   Auth Pages — Login & Register
   Form Validation & UX Enhancements
   ======================================== */

(function () {
  'use strict';

  // --- Utility ---
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => (ctx || document).querySelectorAll(sel);

  // --- Validation Rules ---
  const rules = {
    name: {
      test: (v) => v.trim().length >= 2 && /^[A-Za-z\s'-]+$/.test(v.trim()),
      msg: 'Please enter a valid name (letters only, min 2 characters)',
    },
    email: {
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
      msg: 'Please enter a valid email address',
    },
    password: {
      test: (v) => v.length >= 6,
      msg: 'Password must be at least 6 characters',
    },
    confirmPassword: {
      test: (v, form) => v === form.querySelector('[name="password"]').value,
      msg: 'Passwords do not match',
    },
    mobile: {
      test: (v) => /^\d{10}$/.test(v.trim()),
      msg: 'Please enter a valid 10-digit mobile number',
    },
    terms: {
      test: (v, form) => form.querySelector('[name="terms"]').checked,
      msg: 'Please accept the Terms of Service',
    },
  };

  // --- Validate a single field ---
  function validateField(field) {
    const form = field.closest('form');
    const errorEl = form.querySelector(`[data-error="${field.name}"]`);
    const rule = rules[field.name];
    let valid = true;

    if (field.type === 'checkbox') {
      valid = rule ? rule.test(null, form) : field.checked;
    } else {
      valid = rule ? rule.test(field.value, form) : field.value.trim().length > 0;
    }

    field.classList.toggle('error', !valid);
    if (errorEl) {
      errorEl.textContent = valid ? '' : (rule ? rule.msg : 'This field is required');
      errorEl.classList.toggle('auth-field-success', valid);
    }
    return valid;
  }

  // --- Validate entire form ---
  function validateForm(form) {
    let isValid = true;
    const fields = form.querySelectorAll('[data-validate]');
    fields.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });
    return isValid;
  }

  // --- Attach validation to a form ---
  function initFormValidation(form) {
    const fields = form.querySelectorAll('[data-validate]');

    // Real-time validation on blur
    fields.forEach((field) => {
      field.addEventListener('blur', () => validateField(field));

      // Re-validate on input after first error
      field.addEventListener('input', function () {
        if (this.classList.contains('error')) {
          validateField(this);
        }
      });

      // Special: confirmPassword re-validates when password changes
      if (field.name === 'password') {
        const confirmField = form.querySelector('[name="confirmPassword"]');
        if (confirmField) {
          field.addEventListener('input', () => {
            if (confirmField.value) validateField(confirmField);
          });
        }
      }
    });

    // Form submit
    form.addEventListener('submit', function (e) {
      if (!validateForm(this)) {
        e.preventDefault();
        // Focus the first error field
        const firstError = this.querySelector('.error');
        if (firstError) firstError.focus();
      }
    });
  }

  // --- Password visibility toggle ---
  function initPasswordToggle() {
    $$('.auth-toggle-password').forEach((btn) => {
      btn.addEventListener('click', function () {
        const input = this.closest('.auth-input-wrapper').querySelector('input');
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        this.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
      });
    });
  }

  // --- Initialize on DOM ready ---
  document.addEventListener('DOMContentLoaded', function () {
    // Login form
    const loginForm = $('#loginForm');
    if (loginForm) initFormValidation(loginForm);

    // Register form
    const registerForm = $('#registerForm');
    if (registerForm) initFormValidation(registerForm);

    // Password toggle buttons
    initPasswordToggle();
  });

})();
