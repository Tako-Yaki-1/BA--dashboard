# Build vendor/ so a clean clone runs without Composer on the host.
FROM composer:2 AS vendor
WORKDIR /build
COPY . .
RUN composer install --no-interaction --prefer-dist --no-progress

FROM php:8.2-cli
RUN docker-php-ext-install pdo_mysql
COPY --from=vendor /build/vendor /opt/vendor
EXPOSE 8000

WORKDIR /var/www/html
CMD ["sh", "-c", "[ -d vendor ] || ln -s /opt/vendor vendor; exec php artisan serve --host=0.0.0.0 --port=8000"]
