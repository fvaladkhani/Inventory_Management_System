cd /home/adgserver/domains/ism.adgserver.ir/public_html
cat > INSTALL.md << 'ENDOFFILE'
# Installation Guide (Production, SQLite)

This guide covers deploying the Inventory Management System on a Linux server (tested on Virtualmin/Apache) using the default SQLite database.

## Prerequisites

- PHP 8.1+ with `pdo_sqlite` and `sqlite3` extensions enabled
- Composer 2.x
- Node.js 18+ and npm
- Apache with `mod_rewrite` enabled, `AllowOverride All`

## 1. Clone the repository

```bash
git clone https://github.com/fvaladkhani/Inventory_Management_System.git
```

Clone (or move the contents) directly into your domain's document root folder.

## 2. Backend setup (Laravel)

```bash
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
```

Edit `.env` and set:

```env
DB_CONNECTION=sqlite
DB_DATABASE=/absolute/path/to/backend/database/database.sqlite
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
SANCTUM_STATEFUL_DOMAINS=your-domain.com
SESSION_DOMAIN=your-domain.com
```

Create the database file and run migrations:

```bash
touch database/database.sqlite
php artisan migrate --force
php artisan db:seed --force
```

This creates a default admin user: `admin` / `admin`. **Change this password immediately after first login.**

Set permissions:

```bash
chmod -R 775 storage bootstrap/cache
```

## 3. Web server document root

Point your Apache/Nginx **document root to `backend/public`**, not the project root.

Example Apache `<VirtualHost>` snippet:

```apache
DocumentRoot /path/to/project/backend/public
<Directory /path/to/project/backend/public>
    AllowOverride All
    Require all granted
</Directory>
```

Make sure `backend/public/.htaccess` exists (it ships with the repo). If missing, Laravel's standard `.htaccess` is required for pretty URLs / API routing to work — see Laravel docs.

## 4. CORS and allowed origins

This project uses a custom middleware at `backend/app/Http/Middleware/Cors.php` (not the standard `config/cors.php`). Update the `Access-Control-Allow-Origin` value in **both** places inside that file to match your production domain:

```php
->header('Access-Control-Allow-Origin', 'https://your-domain.com')
```

## 5. Frontend setup (React)

```bash
cd ../frontend
npm install --legacy-peer-deps
```

Create `frontend/.env`:

```env
REACT_APP_API_URL=https://your-domain.com/api
```

Build the production bundle:

```bash
npm run build
```

## 6. Serve frontend and backend from the same domain

Copy the React build into Laravel's public folder:

```bash
cp -r build/* ../backend/public/
```

Replace `backend/routes/web.php` with a catch-all route so React Router can handle client-side routes, while leaving `/api/*` untouched:

```php
<?php
use Illuminate\Support\Facades\Route;

Route::get('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '^(?!api).*$');

require __DIR__.'/auth.php';
```

Clear caches:

```bash
php artisan route:clear
php artisan config:clear
```

## 7. Restart the web server

```bash
systemctl restart apache2
```

(A full restart, not just reload, is recommended if using `mod_fcgid`/`FCGIWrapper` — OPcache may otherwise serve stale PHP.)

## Done

Visit `https://your-domain.com`, log in with `admin` / `admin`, and change the password immediately.

## Troubleshooting

- **`could not find driver` on migrate** → the `pdo_sqlite` PHP extension isn't installed (`apt install php{version}-sqlite3`).
- **`/api/*` routes return a plain HTML 404** → `backend/public/.htaccess` is missing or `mod_rewrite` isn't enabled.
- **CORS errors in the browser console** → check `app/Http/Middleware/Cors.php`, not `config/cors.php`.
- **Changes to PHP files don't seem to take effect** → restart Apache fully to clear stale opcode cache from `mod_fcgid` workers.
ENDOFFILE