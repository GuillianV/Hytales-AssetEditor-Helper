import fs from "fs";
import path from "path";

const __dirname = import.meta.dirname;
let __rootname = path.join(__dirname, "../");
const datafolder = "data";
const gamefolder = "game";
const serverfolder = path.join(__rootname, datafolder, gamefolder, "Server");
const propertiesfolder = path.join(__rootname, datafolder, "properties");
if (!fs.existsSync(propertiesfolder))
  fs.mkdirSync(propertiesfolder, { recursive: true });

const assetsPath = serverfolder;

var walk = function (dir, done) {
  var results = [];
  fs.readdir(dir, function (err, list) {
    if (err) return done(err);
    var i = 0;
    (function next() {
      var file = list[i++];
      if (!file) return done(null, results);
      const filename = file;
      file = path.resolve(dir, file);
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function (err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          results.push({ file, filename });
          next();
        }
      });
    })();
  });
};

walk(assetsPath, function (err, results) {
  if (err) throw err;
  writeData(results);
});

function writeData(results) {
  const errorPaths = [];

  const generateProperties = new GenerateProperties();

  for (let index = 0; index < results.length; index++) {
    const result = results[index];
    const fullpath = result.file;
    const filename = result.filename;

    if (
      !filename.endsWith(".json") ||
      filename.endsWith("BranchInfo.json") ||
      filename.endsWith(".node.json")
    )
      continue;

    const partialpath = fullpath.replace(assetsPath, "");

    let data;
    try {
      data = fs.readFileSync(fullpath, "utf8");
      data = data.replace(
        /\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g,
        (m, g) => (g ? "" : m),
      );
      data = JSON.parse(data);
    } catch (_) {
      errorPaths.push(fullpath);
    }
    if (!data) continue;

    console.log(partialpath);
    console.log(`${index + 1}/${results.length}`);
    try {
      generateProperties.masterTick(data, partialpath);
    } catch (e) {
      console.log(e);
    }
  }
  generateProperties.endProcess();
  Object.entries(generateProperties.properties).forEach(([key, property]) => {
    try {
      fs.writeFileSync(
        `${propertiesfolder}/${key.replaceAll("*", "")}.json`,
        JSON.stringify(property, null, 2),
        { encoding: "utf8" },
      );
    } catch (e) {
      console.log(key, e);
    }
  });

  console.log("Properties generated");
}

class GenerateProperties {
  constructor() {
    this.partialpath = "";
    this.properties = {};
  }

  generateProperty = (key) => {
    if (!this.properties[key]) {
      this.properties[key] = {
        properties: [],
        array_properties: [],
        array_primitives: [],
        primitives: [],
        exemples: [],
      };
    }
  };

  propertyExist = (key) => {
    return typeof this.properties[key] === "object";
  };

  generateExamples = (key) => {
    if (
      this.propertyExist(key) &&
      !this.properties[key].exemples.includes(this.partialpath)
    ) {
      this.properties[key].exemples.push(this.partialpath);
    }
  };

  isArray = (data) => {
    return Array.isArray(data) && data.length > 0;
  };

  isObject = (data) => {
    return typeof data === "object" && !Array.isArray(data);
  };

  masterTick = (datas, partialpath) => {
    if (typeof datas !== "object") return;
    this.partialpath = partialpath;
    this.tickMultiple(datas);
  };

  tickMultiple = (datas_object) => {
    Object.keys(datas_object).forEach((key) => {
      this.tickSingle(datas_object[key], key);
    });
  };

  tickSingle = (data, key) => {
    if (!data) return;
    this.generateProperty(key);
    this.generateExamples(key);

    if (this.isObject(data)) {
      Object.keys(data).forEach((subkey) => {
        if (!this.properties[key].properties.includes(subkey)) {
          this.properties[key].properties.push(subkey);
        }

        this.tickSingle(data[subkey], subkey);
      });
    } else if (this.isArray(data)) {
      data.forEach((subkeys) => {
        if (subkeys == null || this.isArray(subkeys)) return;

        if (!this.isObject(subkeys)) {
          if (!this.properties[key].array_primitives.includes(subkeys))
            this.properties[key].array_primitives.push(subkeys);
        } else {
          Object.keys(subkeys).forEach((subkey) => {
            if (!this.properties[key].array_properties.includes(subkey)) {
              this.properties[key].array_properties.push(subkey);
            }

            this.tickSingle(subkeys[subkey], subkey);
          });
        }
      });
    } else if (!this.properties[key].primitives.includes(data)) {
      this.properties[key].primitives.push(data);
    }
  };

  endProcess = () => {
    Object.entries(this.properties).forEach(([key, property]) => {
      if (property.properties.length == 0) {
        delete property.properties;
      }

      if (property.array_properties.length == 0) {
        delete property.array_properties;
      }

      if (property.array_primitives.length == 0) {
        delete property.array_primitives;
      }

      if (property.primitives.length == 0) {
        delete property.primitives;
      }
    });
  };
}
