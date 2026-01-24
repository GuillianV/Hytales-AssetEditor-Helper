import express from "express";
import fs from "fs";
import path from "path";

const __dirname = import.meta.dirname;
const data = "data/properties";
const server = "data/game/Server";
const app = express();

app.get("/properties/:key", (req, res) => {
  const key = req.params.key;
  if (!fs.existsSync(`${data}/${key.replaceAll("*", "")}.json`)) {
    res.status(404).json({ error: "Property not found" });
    return;
  } else {
    const property = fs.readFileSync(`${data}/${key.replaceAll("*", "")}.json`, "utf8");
    res.json(JSON.parse(property));
  }
});

app.get("/game/server/asset/", (req, res) => {
  const { fullpath } = req.query;

  if (typeof fullpath !== "string" || !fs.existsSync(`${server}/${fullpath}`)) {
    res.status(404).json({ error: "Server asset not found" });
    return;
  } else {
    const property = fs.readFileSync(`${server}/${fullpath}`, "utf8");
    res.json(JSON.parse(property));
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
