# Vintage64TX — Website

Static HTML site for [vintage64tx.com](https://vintage64tx.com). Deployed via Cloudflare Pages on push to `main`.

---

## File Structure

```
/
├── index.html          Home page
├── services.html       Services page (replaces business.html)
├── about.html          About DeWayne — bio, credentials, career timeline, FAQ
├── contact.html        Contact form + direct email
├── style.css           All styles — design system, layout, components, responsive
├── sitemap.xml         XML sitemap for search engines
├── _redirects          Cloudflare Pages redirect rules
├── favicon-texas-v.png Site favicon (root)
├── privacy-policy.html Privacy policy (existing — not modified)
└── media/
    ├── hero-vintage.jpg             Home hero + CWD-02 card placeholder
    ├── phoenix-conversion-hero.jpg  PHX-01 service card
    ├── system-deep-clean-hero.jpg   Services page hero
    ├── os-hardening-hero.jpg        Contact page hero
    └── logo.webp                    OG/Twitter card image
```

---

## Deployment

Cloudflare Pages auto-deploys on every push to `main`. No build step — files are served directly.

---

## Placeholders to Replace Before Going Live

| Placeholder | Location | What to put there |
|---|---|---|
| `PLACEHOLDER_WORKER_URL` | `contact.html` | Your Cloudflare Worker URL for form handling |
| `PLACEHOLDER_CF_ANALYTICS_TOKEN` | All HTML files (×4) | Your Cloudflare Analytics token |
| Review content | `index.html`, `services.html` | Real client quotes, names, service labels |

---

## Email Obfuscation

The email address `dewayne@vintage64tx.com` is never written directly in the HTML. Instead, it is assembled by JavaScript at page load from data attributes:

```html
<a href="#" class="email-link"
   data-u="dewayne"
   data-d="vintage64tx"
   data-t="com">[email protected]</a>
```

The JS replaces the `href` and `textContent` on load. This prevents simple bot scrapers from harvesting the address. The fallback placeholder text is visible only if JS is disabled.

---

## Images

All hero and card images live in the `media/` folder. The site references them as `media/filename.jpg`.

The favicon (`favicon-texas-v.png`) lives in the repo root, not `media/`.

---

## Navigation

All pages share the same nav structure:

```
Home | Services | About | Contact | [Contact Us →]
```

- "Contact Us" button links to `contact.html` on all pages except `contact.html` itself, where it links to `#form` (scrolls to the form).
- Active page gets `class="active"` and `aria-current="page"` on its nav link.
- Mobile nav is a drawer toggled by the hamburger button.

---

## Redirects

`_redirects` handles the old business URL:

```
/business        /services.html  301
/business.html   /services.html  301
```

---

## Files That Can Be Deleted From the Repo

These files from the previous version are no longer part of the site:

| File | Reason |
|---|---|
| `business.html` | Replaced by `services.html` |
| `card.html` | Not linked anywhere in the new site |
| `logs.html` | Not linked anywhere in the new site |
| `sitemap.html` | Replaced by `sitemap.xml` |
| `admin/` folder | Not part of the public site |

Verify nothing links to these before deleting. The `_redirects` file handles any inbound links to `business.html`.

---

## Design System

Defined as CSS custom properties in `style.css`:

```css
--bg: #0B0E12           /* Page background */
--bg-elevated: #12161C  /* Card / elevated surface */
--border: #232A33       /* Default border */
--text: #E7EAEE         /* Body text */
--text-muted: #8893A1   /* Secondary text */
--blue: #3E7BFA         /* Accent blue */
--rust: #C1572E         /* CTA / rust accent */
--maxw: 1180px          /* Max content width */
```

Fonts: **Inter** (body/UI) + **JetBrains Mono** (labels/code) via Google Fonts.

---

*Built without a framework — static HTML, on purpose.*
