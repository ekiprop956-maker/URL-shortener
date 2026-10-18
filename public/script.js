
const form = document.getElementById("shorten-form");
const urlInput = document.getElementById("originalUrl");
const shortenButton = document.getElementById("shorten-button");
const buttonText = document.getElementById("button-text");
const message = document.getElementById("message");
const result = document.getElementById("result");
const shortUrlElement = document.getElementById("shortUrl");
const originalPreview = document.getElementById("original-preview");
const copyButton = document.getElementById("copy-button");
const openLink = document.getElementById("open-link");

let currentShortUrl = "";

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const originalUrl = urlInput.value.trim();

  result.hidden = true;
  currentShortUrl = "";
  copyButton.textContent = "Copy";
  showMessage("");

  shortenButton.disabled = true;
  buttonText.textContent = "Creating your link...";

  try {
    const response = await fetch("/api/urls", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ originalUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Could not shorten this URL."
      );
    }

    currentShortUrl = data.shortUrl;

    shortUrlElement.textContent = currentShortUrl;
    shortUrlElement.href = currentShortUrl;
    openLink.href = currentShortUrl;
    originalPreview.textContent = data.originalUrl;

    result.hidden = false;
    showMessage("Your short link was created successfully.", "success");
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    showMessage(
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.",
      "error"
    );
  } finally {
    shortenButton.disabled = false;
    buttonText.textContent = "Shorten URL";
  }
});

copyButton.addEventListener("click", async () => {
  if (!currentShortUrl) return;

  try {
    await navigator.clipboard.writeText(currentShortUrl);
    copyButton.textContent = "Copied!";
  } catch {
    // Fallback for browsers that do not support clipboard access.
    const temporaryInput = document.createElement("textarea");
    temporaryInput.value = currentShortUrl;
    temporaryInput.style.position = "fixed";
    temporaryInput.style.opacity = "0";
    document.body.appendChild(temporaryInput);
    temporaryInput.select();

    const copied = document.execCommand("copy");
    temporaryInput.remove();
    copyButton.textContent = copied ? "Copied!" : "Select link to copy";
  }

  window.setTimeout(() => {
    copyButton.textContent = "Copy";
  }, 2000);
});
