# Fake Data Management Commands

This directory contains development commands for generating and cleaning fake data.

## Current Recommended Commands

### Create fake data for the current app domain

```bash
# Default volume
python manage.py create_fake_data

# Same count for blogs, peluches, users and orders
python manage.py create_fake_data 20

# Explicit counts
python manage.py create_fake_data --blogs 10 --peluches 20 --users 10 --orders 15
```

This command now creates data for the current MIMITTOS models:

- `Category`
- `GlobalColor`
- `GlobalSize`
- `Peluch`
- `Order`
- `Blog`
- customer `User`

Legacy flags are still accepted for compatibility:

```bash
python manage.py create_fake_data --products 20 --sales 15
```

They map to `--peluches` and `--orders` and print a deprecation warning.

### Delete fake data created by the master command

```bash
python manage.py delete_fake_data --confirm
```

This removes only records marked as fake by `create_fake_data` and preserves staff/superusers.

## Legacy Individual Commands

The following commands still exist for the old `Product` / `Sale` domain:

- `create_products`
- `create_sales`
- `create_users`
- `create_blogs`

They are not the source of truth for the current storefront and backoffice flows.
