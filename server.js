import express from "express";
import fs from "fs";

const data = "data/properties";
const server = "data/game/Server";
const app = express();

const properties = fs.readdirSync(data);

app.get("/properties", (req, res) => {
  res.json(properties);
});

app.get("/properties/:key", (req, res) => {
  let key = req.params.key;
  if (!key) {
    res.status(400).json({ error: "Key is required" });
    return;
  }
  key = key.toLowerCase();
  res.json([
    ...properties.filter((p) => {
      return p.toLowerCase().startsWith(key);
    }),
    ...properties.filter((p) => {
      return p.toLowerCase().includes(key) && !p.toLowerCase().startsWith(key);
    }),
  ]);
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
