







const express = require("express");

const app = express();
const PORT = 8080;

app.use(express.json());

//   Logging middleware


function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
}
app.use(logger);


const urlData = {};


// generate code fxn


function generateShortcode(length = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

//validate URL



function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

//    POST /shorturls
app.post("/shorturls", (req, res) => {
  let { url, validity, shortcode } = req.body;

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid or missing URL" });
  }

  validity = Number(validity);
  if (!validity || validity <= 0) validity = 30;

  if (shortcode) {
    if (urlData[shortcode]) {
      return res.status(409).json({ error: "Shortcode already exists" });
    }
    if (!/^[a-zA-Z0-9]{4,10}$/.test(shortcode)) {
      return res.status(400).json({ error: "Invalid shortcode format" });
    }
  } else {
    do {
      shortcode = generateShortcode();
    } while (urlData[shortcode]);
  }

  const createdAt = new Date();
  const expiry = new Date(Date.now() + validity * 60000);

  urlData[shortcode] = {
    originalUrl: url,
    createdAt,
    expiry,
    clicks: [],
  };

  res.status(201).json({
    shortLink: `http://localhost:${PORT}/${shortcode}`,
    expiry: expiry.toISOString(),
  });
});

// GET /:shortcode (redirect)
app.get("/:shortcode", (req, res) => {
  const shortcode = req.params.shortcode;
  const data = urlData[shortcode];

  if (!data) return res.status(404).json({ error: "Shortcode not found" });

  if (new Date() > data.expiry) {
    return res.status(410).json({ error: "Shortcode expired" });
  }

  data.clicks.push({
    timestamp: new Date(),
    referrer: req.get("Referrer") || "direct",
    location: "unknown",
  });

  res.redirect(data.originalUrl);
});

// GET /shorturls/:shortcode (analytics)
app.get("/shorturls/:shortcode", (req, res) => {
  const shortcode = req.params.shortcode;
  const data = urlData[shortcode];

  if (!data) return res.status(404).json({ error: "Shortcode not found" });

  res.json({
    originalUrl: data.originalUrl,
    createdAt: data.createdAt,
    expiry: data.expiry,
    totalClicks: data.clicks.length,
    clicks: data.clicks,
  });
});

app.listen(PORT, () => {
  console.log(`URL Shortener running on port ${PORT}`);
});
