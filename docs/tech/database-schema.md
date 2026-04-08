# database-schema.md

## Convenciones
- Todos los IDs son UUID generados por Supabase
- Timestamps: `created_at`, `updated_at` en todas las tablas
- Soft delete donde aplique: `deleted_at` nullable
- Nombres de tablas en `snake_case` plural
- Supabase maneja `auth.users` — nuestra tabla `users` extiende ese perfil

---

## users
| columna      | tipo        | notas                                     |
|--------------|-------------|-------------------------------------------|
| id           | uuid        | PK, referencia `auth.users.id`            |
| first_name   | text        | NOT NULL                                  |
| last_name    | text        | NOT NULL                                  |
| email        | text        | NOT NULL, unique                          |
| address      | text        | nullable                                  |
| state        | text        | nullable                                  |
| city         | text        | nullable                                  |
| role         | text        | `'client' | 'admin'`, default `'client'`  |
| created_at   | timestamptz | default `now()`                           |
| updated_at   | timestamptz | default `now()`                           |

---

## categories
| columna      | tipo        | notas            |
|--------------|-------------|------------------|
| id           | uuid        | PK               |
| name         | text        | NOT NULL, unique |
| slug         | text        | NOT NULL, unique |
| created_at   | timestamptz | default `now()`  |

---

## products
| columna      | tipo        | notas                                 |
|--------------|-------------|---------------------------------------|
| id           | uuid        | PK                                    |
| category_id  | uuid        | FK → `categories.id`                  |
| name         | text        | NOT NULL                              |
| slug         | text        | NOT NULL, unique                      |
| description  | text        | nullable                              |
| base_price   | numeric     | NOT NULL (precio base sin variación)  |
| images       | text[]      | array de URLs                         |
| is_featured  | boolean     | default `false`                       |
| is_active    | boolean     | default `true`                        |
| created_at   | timestamptz | default `now()`                       |
| updated_at   | timestamptz | default `now()`                       |
| deleted_at   | timestamptz | nullable, soft delete                 |

---

## product_variants
| columna        | tipo        | notas                                      |
|----------------|-------------|--------------------------------------------|
| id             | uuid        | PK                                         |
| product_id     | uuid        | FK → `products.id`                         |
| sku            | text        | NOT NULL, unique                           |
| variant_name   | text        | NOT NULL (ej. `"Rosa 15ml"`, `"Transparente"`) |
| price          | numeric     | NOT NULL (puede diferir del `base_price`)  |
| stock          | integer     | NOT NULL, default `0`                      |
| is_active      | boolean     | default `true`                             |
| created_at     | timestamptz | default `now()`                            |
| updated_at     | timestamptz | default `now()`                            |

---

## favorites
| columna      | tipo        | notas                |
|--------------|-------------|----------------------|
| id           | uuid        | PK                   |
| user_id      | uuid        | FK → `users.id`      |
| product_id   | uuid        | FK → `products.id`   |
| created_at   | timestamptz | default `now()`      |

---

## carts
| columna      | tipo        | notas                                          |
|--------------|-------------|------------------------------------------------|
| id           | uuid        | PK                                             |
| user_id      | uuid        | FK → `users.id`, unique (1 carrito por usuario)|
| expires_at   | timestamptz | NOT NULL (ej. `now() + 7 days`)                |
| created_at   | timestamptz | default `now()`                                |
| updated_at   | timestamptz | default `now()`                                |

---

## cart_items
| columna          | tipo        | notas                    |
|------------------|-------------|--------------------------|
| id               | uuid        | PK                       |
| cart_id          | uuid        | FK → `carts.id`          |
| product_id       | uuid        | FK → `products.id`       |
| variant_id       | uuid        | FK → `product_variants.id` |
| quantity         | integer     | NOT NULL, default `1`    |
| created_at       | timestamptz | default `now()`          |

---

## orders
| columna          | tipo        | notas                                                             |
|------------------|-------------|-------------------------------------------------------------------|
| id               | uuid        | PK                                                                |
| user_id          | uuid        | FK → `users.id`                                                   |
| status           | text        | `'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled'` |
| total            | numeric     | NOT NULL                                                          |
| delivery_type    | text        | `'shipping' | 'pickup'`                                          |
| shipping_address | text        | nullable                                                          |
| shipping_state   | text        | nullable                                                          |
| shipping_city    | text        | nullable                                                          |
| shipping_cost    | numeric     | default `0`                                                       |
| created_at       | timestamptz | default `now()`                                                   |
| updated_at       | timestamptz | default `now()`                                                   |

---

## order_items
| columna        | tipo        | notas                                      |
|----------------|-------------|--------------------------------------------|
| id             | uuid        | PK                                         |
| order_id       | uuid        | FK → `orders.id`                           |
| product_id     | uuid        | FK → `products.id`                         |
| variant_id     | uuid        | FK → `product_variants.id`                 |
| quantity       | integer     | NOT NULL                                   |
| unit_price     | numeric     | NOT NULL (precio al momento de compra)     |
| created_at     | timestamptz | default `now()`                            |

---

## payments
| columna           | tipo        | notas                                               |
|-------------------|-------------|-----------------------------------------------------|
| id                | uuid        | PK                                                  |
| user_id           | uuid        | FK → `users.id`                                     |
| amount            | numeric     | NOT NULL                                            |
| currency          | text        | default `'MXN'`                                     |
| provider          | text        | `'mercadopago'`                                     |
| provider_ref      | text        | ID de transacción/preferencia en MercadoPago        |
| status            | text        | `'pending' | 'approved' | 'rejected' | 'refunded'` |
| order_id          | uuid        | FK → `orders.id`, nullable                          |
| appointment_id    | uuid        | FK → `appointments.id`, nullable                    |
| course_reg_id     | uuid        | FK → `course_registrations.id`, nullable            |
| created_at        | timestamptz | default `now()`                                     |
| updated_at        | timestamptz | default `now()`                                     |

**Regla:** solo una de las tres FK (`order_id`, `appointment_id`, `course_reg_id`) tiene valor. Las otras dos son `null`.

**Nota:** si en el futuro se soporta un segundo proveedor de pagos, actualizar también `types/index.ts`, `tech/api-design.md` y `payments/proveedorpagos.md`.

---

## professionals
| columna      | tipo        | notas            |
|--------------|-------------|------------------|
| id           | uuid        | PK               |
| name         | text        | NOT NULL         |
| bio          | text        | nullable         |
| photo_url    | text        | nullable         |
| is_active    | boolean     | default `true`   |
| created_at   | timestamptz | default `now()`  |

---

## services
| columna      | tipo        | notas                |
|--------------|-------------|----------------------|
| id           | uuid        | PK                   |
| name         | text        | NOT NULL             |
| description  | text        | nullable             |
| price        | numeric     | NOT NULL             |
| duration_min | integer     | NOT NULL             |
| is_active    | boolean     | default `true`       |
| created_at   | timestamptz | default `now()`      |
| updated_at   | timestamptz | default `now()`      |

---

## appointments
| columna          | tipo        | notas                                                  |
|------------------|-------------|--------------------------------------------------------|
| id               | uuid        | PK                                                     |
| user_id          | uuid        | FK → `users.id`                                        |
| professional_id  | uuid        | FK → `professionals.id`, nullable                      |
| appointment_type | text        | `'individual' | 'group'`                               |
| date             | date        | NOT NULL                                               |
| start_time       | time        | NOT NULL                                               |
| end_time         | time        | NOT NULL (fijo al momento de reservar)                 |
| total            | numeric     | NOT NULL                                               |
| status           | text        | `'pending' | 'paid' | 'completed' | 'cancelled'`     |
| created_at       | timestamptz | default `now()`                                        |
| updated_at       | timestamptz | default `now()`                                        |

---

## appointment_services
| columna          | tipo        | notas                                          |
|------------------|-------------|------------------------------------------------|
| id               | uuid        | PK                                             |
| appointment_id   | uuid        | FK → `appointments.id`                         |
| service_id       | uuid        | FK → `services.id`                             |
| unit_price       | numeric     | NOT NULL (precio al momento de reservar)       |

---

## blocked_slots
| columna         | tipo        | notas                                              |
|-----------------|-------------|----------------------------------------------------|
| id              | uuid        | PK                                                 |
| professional_id | uuid        | FK → `professionals.id`, nullable (`null` = todos) |
| date            | date        | NOT NULL                                           |
| start_time      | time        | NOT NULL                                           |
| end_time        | time        | NOT NULL                                           |
| reason          | text        | nullable                                           |
| created_at      | timestamptz | default `now()`                                    |

---

## instructors
| columna      | tipo        | notas            |
|--------------|-------------|------------------|
| id           | uuid        | PK               |
| name         | text        | NOT NULL         |
| bio          | text        | nullable         |
| photo_url    | text        | nullable         |
| created_at   | timestamptz | default `now()`  |

---

## courses
| columna        | tipo        | notas                                                        |
|----------------|-------------|--------------------------------------------------------------|
| id             | uuid        | PK                                                           |
| instructor_id  | uuid        | FK → `instructors.id`, nullable                              |
| title          | text        | NOT NULL                                                     |
| description    | text        | nullable                                                     |
| cover_image    | text        | nullable, URL en Supabase Storage                            |
| price          | numeric     | NOT NULL                                                     |
| capacity       | integer     | NOT NULL                                                     |
| level          | text        | `'beginner' | 'intermediate' | 'advanced' | 'open'`        |
| start_date     | date        | NOT NULL                                                     |
| end_date       | date        | nullable (cursos de varios días)                             |
| start_time     | time        | NOT NULL                                                     |
| location       | text        | nullable                                                     |
| is_published   | boolean     | default `false`                                              |
| created_at     | timestamptz | default `now()`                                              |
| updated_at     | timestamptz | default `now()`                                              |

---

## course_registrations
| columna          | tipo        | notas                                          |
|------------------|-------------|------------------------------------------------|
| id               | uuid        | PK                                             |
| course_id        | uuid        | FK → `courses.id`                              |
| user_id          | uuid        | FK → `users.id`, nullable                      |
| attendees        | integer     | NOT NULL, default `1`                          |
| status           | text        | `'pending' | 'paid' | 'cancelled'`            |
| added_by_admin   | boolean     | default `false`                                |
| created_at       | timestamptz | default `now()`                                |

---

## Relaciones clave

- `users` → `orders` (1:N)
- `users` → `appointments` (1:N)
- `users` → `course_registrations` (1:N)
- `users` → `carts` (1:1)
- `users` → `favorites` (1:N)
- `orders` → `order_items` (1:N)
- `order_items` → `products` (N:1)
- `order_items` → `product_variants` (N:1)
- `products` → `product_variants` (1:N)
- `products` → `categories` (N:1)
- `products` → `favorites` (1:N)
- `carts` → `cart_items` (1:N)
- `cart_items` → `product_variants` (N:1)
- `appointments` → `appointment_services` (1:N)
- `appointment_services` → `services` (N:1)
- `appointments` → `professionals` (N:1)
- `courses` → `course_registrations` (1:N)
- `courses` → `instructors` (N:1)
- `payments` → `orders` (N:1, nullable)
- `payments` → `appointments` (N:1, nullable)
- `payments` → `course_registrations` (N:1, nullable)

---

## Pendientes que afectan este schema

- [ ] Confirmar número de profesionales con Liz
- [ ] Confirmar si mayoreo aplica (requeriría tabla `wholesale_tiers`)
- [ ] Confirmar si hay certificados (requeriría tabla `certificates`)
- [ ] Confirmar política de reembolso en cursos y productos
- [ ] Definir tiempo de expiración del carrito (recomendado: 7 días)