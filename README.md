# URL Shortener

## 1. Project Overview

The URL Shortener is a backend application that converts long URLs into shorter, unique links. When a user visits a short link, the application redirects them to the original destination.

The project demonstrates REST API development, URL validation, unique identifier generation, database integration, HTTP redirection, error handling, and automated testing.

## 2. Technologies Used

- **Node.js** — JavaScript runtime
- **TypeScript** — type-safe application development
- **Express.js** — HTTP server and REST API
- **PostgreSQL** — relational database
- **Prisma ORM** — database access and schema management
- **Vitest** — automated testing
- **Supertest** — HTTP endpoint testing

## 3. Features

- Create shortened URLs through a REST API.
- Generate unique, eight-character Base62 short codes.
- Validate absolute HTTP and HTTPS URLs.
- Store URL records persistently in PostgreSQL.
- Redirect visitors using HTTP 302 responses.
- Retrieve details about shortened URLs.
- Return structured JSON error responses.
- Automatically test core API behavior.

## 4. Requirements

Install the following before running the application:

- Node.js and npm
- PostgreSQL
- Git (optional)

## 5. Installation and Setup

### Step 1: Install dependencies

```bash
npm install
```

### Step 2: Configure environment variables

Configure the PostgreSQL connection using the project's existing `.env` and Prisma configuration.

Example database URL:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/url_shortener?schema=public"
```

Replace `USERNAME` and `PASSWORD` with your PostgreSQL credentials. Keep `.env` private and do not commit real credentials to version control.

### Step 3: Apply database migrations

```bash
npx prisma migrate deploy
```

For a development database where you are creating new migrations, use:

```bash
npx prisma migrate dev
```

### Step 4: Generate the Prisma client

```bash
npx prisma generate
```

## 6. Running the Application

Start the development server:

```bash
npm run dev
```

The local API runs at:

`http://localhost:3000`

The health-check endpoint is:

`GET http://localhost:3000/`

## 7. API Endpoints

### Health check

**Request**

```http
GET /
```

Returns a message confirming that the API is running.

### Create a shortened URL

**Request**

```http
POST /api/urls
Content-Type: application/json
```

**Example body**

```json
{
  "originalUrl": "https://example.com/articles/software-engineering"
}
```

**Success response:** `201 Created`

The response contains the database ID, original URL, short code, short URL, and creation timestamp.

### Retrieve URL details

**Request**

```http
GET /api/urls/{shortCode}
```

Returns the stored details for an existing short code.

**Success response:** `200 OK`

If the code does not exist, the API returns `404 Not Found`.

### Redirect to the original URL

**Request**

```http
GET /{shortCode}
```

Returns `302 Found` with a `Location` header pointing to the original destination.

## 8. Error Handling

The API uses appropriate HTTP status codes and structured JSON errors.

| Status | Meaning |
|---|---|
| `201` | URL created successfully |
| `302` | Redirect to original URL |
| `400` | Invalid URL or malformed JSON |
| `404` | Short code not found |
| `413` | Request body too large |
| `503` | Short-code generation attempts exhausted |
| `500` | Unexpected server error |

## 9. Running Automated Tests

Run the test suite with:

```bash
npm test
```

The current automated tests cover:

1. Health-check response
2. Invalid URL rejection
3. Malformed JSON rejection
4. URL creation and retrieval
5. Unknown short-code handling
6. HTTP redirect behavior

Build the TypeScript project using:

```bash
npm run build
```

## 10. Project Limitations and Future Improvements

Possible future improvements include:

- Configurable public base URL for generated links.
- Custom aliases and URL expiration.
- Click analytics and usage statistics.
- Rate limiting and abuse prevention.
- API integration tests using a dedicated test database.
- Deployment to a cloud hosting provider.

## 11. Conclusion

This project implements the core functionality of a URL shortening service using a REST API and persistent relational storage. It demonstrates URL validation, short-code generation, database operations, HTTP redirects, error handling, and automated testing.

