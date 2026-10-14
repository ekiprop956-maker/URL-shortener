
import express, { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma } from "@prisma/client";
import { randomInt } from "node:crypto";

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

const alphabet =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

app.use(express.json({ limit: "10kb" }));

// Generate an 8-character random Base62 code.
function generateShortCode(): string {
  let code = "";

  for (let i = 0; i < 8; i++) {
    code += alphabet[randomInt(alphabet.length)];
  }

  return code;
}

// Validate absolute HTTP and HTTPS URLs.
function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() !== value) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname)
    );
  } catch {
    return false;
  }
}

// Health check.
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "URL Shortener API is running" });
});

 // Retrieve details about a shortened URL.
app.get(
  "/api/urls/:shortCode",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const record = await prisma.url.findUnique({
        where: {
  shortCode: String(req.params.shortCode),
},
      });

      if (!record) {
        return res.status(404).json({
          error: {
            code: "URL_NOT_FOUND",
            message: "No shortened URL exists for this code.",
          },
        });
      }

      return res.status(200).json({
        id: record.id,
        originalUrl: record.originalUrl,
        shortCode: record.shortCode,
        shortUrl: `http://localhost:${PORT}/${record.shortCode}`,
        createdAt: record.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Create a shortened URL.
app.post(
  "/api/urls",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { originalUrl } = req.body ?? {};

      if (!isValidUrl(originalUrl)) {
        return res.status(400).json({
          error: {
            code: "INVALID_URL",
            message: "Provide a valid absolute HTTP or HTTPS URL.",
          },
        });
      }

      for (let attempt = 0; attempt < 5; attempt++) {
        const shortCode = generateShortCode();

        try {
          const record = await prisma.url.create({
            data: { originalUrl, shortCode },
          });

          return res.status(201).json({
            id: record.id,
            originalUrl: record.originalUrl,
            shortCode: record.shortCode,
            shortUrl: `http://localhost:${PORT}/${record.shortCode}`,
            createdAt: record.createdAt,
          });
        } catch (error) {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
          ) {
            // A unique constraint was violated. Generate another code.
            continue;
          }

          throw error;
        }
      }

      return res.status(503).json({
        error: {
          code: "CODE_GENERATION_FAILED",
          message: "Could not generate a unique short code. Try again.",
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Redirect to the original URL.
app.get("/:shortCode", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await prisma.url.findUnique({
      where: {
  shortCode: String(req.params.shortCode),
},
    });

    if (!record) {
      return res.status(404).json({
        error: {
          code: "URL_NOT_FOUND",
          message: "No shortened URL exists for this code.",
        },
      });
    }

    return res.redirect(302, record.originalUrl);
  } catch (error) {
    next(error);
  }
});

// Consistent JSON error handling.
app.use(
  (
    err: Error & { type?: string },
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (res.headersSent) {
      return next(err);
    }

    if (err.type === "entity.parse.failed") {
      return res.status(400).json({
        error: {
          code: "INVALID_JSON",
          message: "The request body must contain valid JSON.",
        },
      });
    }

    if (err.type === "entity.too.large") {
      return res.status(413).json({
        error: {
          code: "PAYLOAD_TOO_LARGE",
          message: "The request body is too large.",
        },
      });
    }

    console.error(err);

    return res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected server error occurred.",
      },
    });
  }
);

async function startServer() {
  try {
    await prisma.$connect();

    app.listen(PORT, () => {
      console.log(`URL Shortener API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not connect to the database:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  }
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}

export { app, prisma };
