# CountrySelect Pro 🌍

[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![jsDelivr](https://data.jsdelivr.com/v1/package/gh/nikmauro/country-select-pro/badge)](https://www.jsdelivr.com/package/gh/nikmauro/country-select-pro)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-yellow)
![Size](https://img.shields.io/badge/size-%3C4KB-brightgreen)

A **lightweight, zero-dependency, vanilla JavaScript country selector** with localized browser validation and **Bootstrap 5 integration**.

CountrySelect Pro provides a clean and fast country dropdown with **search, phone codes, accessibility support and smart browser validation**, without requiring jQuery or any external framework.

---

# ✨ Features

* 🚀 **Zero Dependencies** – No jQuery, no frameworks.
* ⚡ **Ultra Lightweight** – Less than **4KB minified**.
* 🎨 **Bootstrap 5 Ready** – Seamless integration with `input-group`.
* 🔍 **Built-in Search** – Quickly filter countries and phone codes.
* 🛡️ **Smart Validation** – Uses native browser localized validation messages.
* 📱 **Responsive UI** – Works perfectly on mobile and desktop.
* ⌨️ **Keyboard Accessible** – Fully navigable with keyboard.
* 🌐 **International Ready** – Supports ISO country codes.

---

# 🎮 Live Demo

Try the interactive demo:

https://nikmauro.github.io/country-select-pro/docs/

---

# 📦 Installation

## CDN (Recommended)

Include the script via **jsDelivr**:

```html
<script src="https://cdn.jsdelivr.net/gh/nikmauro/country-select-pro@4.8.2/dist/country-select.min.js"></script>
```

---

## Local Installation

Download the repository and include:

```html
<script src="dist/country-select.min.js"></script>
```

---

# 🚀 Basic Usage

```html
<input id="country" class="form-control">

<script>
const countrySelect = new CountrySelect("#country", {
  defaultCountry: "gr"
});
</script>
```

---

# ⚙️ Options

| Option               | Type    | Description                         |
| -------------------- | ------- | ----------------------------------- |
| `defaultCountry`     | string  | Default selected country (ISO code) |
| `preferredCountries` | array   | Countries displayed first           |
| `onlyCountries`      | array   | Restrict selectable countries       |
| `search`             | boolean | Enable / disable search             |
| `placeholder`        | string  | Custom placeholder text             |

Example:

```javascript
new CountrySelect("#country", {
  defaultCountry: "gr",
  preferredCountries: ["gr", "cy", "de"],
  search: true
});
```

---

# 🧩 Bootstrap 5 Example

CountrySelect works perfectly with Bootstrap input groups.

```html
<div class="input-group">
  <span class="input-group-text">🌍</span>
  <input id="country" class="form-control">
</div>
```

```javascript
new CountrySelect("#country");
```

---

# 🌐 Browser Support

Compatible with all modern browsers:

* Chrome
* Firefox
* Safari
* Edge
* Mobile browsers (iOS / Android)

No polyfills required.

---

# 📂 Project Structure

```
country-select-pro
│
├─ dist
│   ├─ country-select.js
│   └─ country-select.min.js
│
├─ demo
├─ src
└─ README.md
```

---

# 🧠 Why CountrySelect Pro?

Many country dropdown libraries rely on **large frameworks like jQuery or heavy UI components**.

CountrySelect Pro was built to be:

* **Tiny**
* **Fast**
* **Dependency-free**
* **Easy to integrate**

Perfect for:

* checkout forms
* registration forms
* shipping address forms
* phone number inputs
* international forms

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Submit a Pull Request

---

# 👨‍💻 Author

Developed by **Nikolaos Mavroeidis**
GitHub: https://github.com/nikmauro

With collaborative assistance from **Gemini (Google AI)**.

---

# 📄 License

MIT License

Feel free to use it in personal and commercial projects.
