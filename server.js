import express from "express";
import fs from "fs";
import cors from "cors";

const data = "data/properties";
const server = "data/game/Server";
const referencesFolder = "data/server-assets-references";
const app = express();

app.use(cors());

const properties = fs.readdirSync(data);
const referencesListRaw = fs.readdirSync(referencesFolder);
const referencesList = referencesListRaw.map((file) => file.replaceAll("$", "/"));

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
  try {
    const key = req.params.key;
    fs.readFile(`${data}/${key}`, "utf8", (err, data) => {
      if (err) {
        res.status(404).json({ error: "Property not found" });
        return;
      }
      res.json(JSON.parse(data));
    });
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

function retrieveAsset(filepath) {
  try {
    return new Promise((resolve, _) => {
      fs.readFile(filepath, "utf8", (err, data) => {
        if (err) {
          resolve({});
          return;
        }

        resolve(JSON.parse(data));
      });
    });
  } catch (_) {
    resolve({});
  }
}

app.get("/game/server/assets/", (req, res) => {
  try {
    res.json({
      references: referencesList,
      total: referencesList.length,
    });
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

app.get("/game/server/assets/:key", (req, res) => {
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

    let filteredProperties = referencesList.filter((p) => {
      return p.toLowerCase().includes(key);
    });

    res.json({
      references: filteredProperties.slice(offset, offset + limit),
      total: filteredProperties.length,
    });
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
    return;
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});

app.get("/game/server/asset/", (req, res) => {
  let { fullpath } = req.query;
  if (!fullpath) {
    res.status(400).json({ error: "fullpath query parameter is required" });
    return;
  }

  fullpath = fullpath.replaceAll("\\\\", "/").replaceAll("\\", "/");

  const serverassetsPromises = [retrieveAsset(`${server}/${fullpath}`), retrieveAsset(`${referencesFolder}/${fullpath.replaceAll("/", "$")}`)];
  Promise.all(serverassetsPromises)
    .then(([asset, references]) => {
      if (!asset) {
        res.status(404).json({ error: "Asset not found" });
        return;
      }
      res.json({ asset, references });
    })
    .catch((e) => {
      res.status(500).json({ error: "Internal server error" });
      return;
    });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
