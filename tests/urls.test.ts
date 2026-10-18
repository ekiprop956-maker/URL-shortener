
import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app, prisma } from "../src/server";

describe("URL Shortener API", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should return a health-check message", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "URL Shortener API is running"
    );
  });

  it("should reject an invalid URL", async () => {
    const response = await request(app)
      .post("/api/urls")
      .send({ originalUrl: "not-a-valid-url" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_URL");
  });

  it("should reject malformed JSON", async () => {
    const response = await request(app)
      .post("/api/urls")
      .set("Content-Type", "application/json")
      .send("{invalid-json}");

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_JSON");
  });

  it("should create and retrieve a shortened URL", async () => {
    const originalUrl =
      "https://example.com/articles/automated-testing";

    const createResponse = await request(app)
      .post("/api/urls")
      .send({ originalUrl });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.originalUrl).toBe(originalUrl);
    expect(createResponse.body.shortCode).toMatch(/^[0-9a-zA-Z]{8}$/);

    const shortCode = createResponse.body.shortCode;

    const lookupResponse = await request(app)
      .get(`/api/urls/${shortCode}`);

    expect(lookupResponse.status).toBe(200);
    expect(lookupResponse.body.originalUrl).toBe(originalUrl);
    expect(lookupResponse.body.shortCode).toBe(shortCode);

    // Clean up the test record so repeated test runs don't accumulate data.
    await prisma.url.delete({ where: { shortCode } });
  });

  it("should return 404 for an unknown short code", async () => {
    const response = await request(app)
      .get("/api/urls/Unknown9");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("URL_NOT_FOUND");
  });

  it("should redirect a short URL to its original destination", async () => {
    const originalUrl = "https://example.com/redirect-test";

    const record = await prisma.url.create({
      data: {
        originalUrl,
        shortCode: "TestCode",
      },
    });

    try {
      const response = await request(app)
        .get(`/${record.shortCode}`)
        .redirects(0);

      expect(response.status).toBe(302);
      expect(response.headers.location).toBe(originalUrl);
    } finally {
      await prisma.url.delete({
        where: { shortCode: record.shortCode },
      });
    }
  });
});
