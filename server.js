import express from "express";
import fs from "fs";
import cors from "cors";

const data = "data/properties";
const server = "data/game/Server";
const app = express();

app.use(cors());

const properties = fs.readdirSync(data);

app.get("/properties", (req, res) => {
  res.json(properties);
});

app.get("/properties/:key", (req, res) => {
  try {
    let key = req.params.key;
    let { offset = 0, limit = 10 } = req.query;
    if (!isNaN(offset)) {
      offset = parseInt(offset);
    } else {
      res.status(400).json({ error: "offset type is not a number" });
      return;
    }
    if (!isNaN(limit)) {
      limit = parseInt(limit);
    } else {
      res.status(400).json({ error: "limit type is not a number" });
      return;
    }

    if (!key) {
      res.status(400).json({ error: "Key is required" });
      return;
    }
    key = key.toLowerCase();
    let filteredProperties = [
      ...properties.filter((p) => {
        return p.toLowerCase().startsWith(key);
      }),
      ...properties.filter((p) => {
        return p.toLowerCase().includes(key) && !p.toLowerCase().startsWith(key);
      }),
    ];

    res.json({
      properties: filteredProperties.slice(offset, offset + limit),
      total: filteredProperties.length,
    });
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

app.get("/property/:key", (req, res) => {
  const key = req.params.key;
  fs.readFile(`${data}/${key}`, "utf8", (err, data) => {
    if (err) {
      res.status(404).json({ error: "Property not found" });
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.get("/game/server/asset/", (req, res) => {
  const { fullpath } = req.query;
  if (!fullpath) {
    res.status(400).json({ error: "fullpath query parameter is required" });
    return;
  }
  fs.readFile(`${server}/${fullpath}`, "utf8", (err, data) => {
    if (err) {
      res.status(404).json({ error: "Server asset not found" });
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
