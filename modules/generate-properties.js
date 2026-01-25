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

const properties = {};

function writeData(results) {
  const fulldata = {};
  const errorPaths = [];

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
      // console.log(fullpath, err);
      errorPaths.push(fullpath);
    }
    if (!data) continue;

    fulldata[partialpath] = data;

    console.log(partialpath);
    console.log(`${index + 1}/${results.length}`);
    try {
      listProperties(data, partialpath);
    } catch (e) {
      console.log(e);
    }
  }

  Object.entries(properties).forEach(([key, property]) => {
    try {
      // if (
      //   property.datas.simple.values.length == 0 &&
      //   property.datas.simple.types.length == 0
      // ) {
      //   delete property.datas.simple;
      // } else {
      //   property.datas.simple.values = uniq(property.datas.simple.values);
      // }

      // if (property.sub.length == 0) {
      //   delete property.sub;
      // }

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

function uniq(a) {
  return a.sort().filter(function (item, pos, ary) {
    return !pos || item != ary[pos - 1];
  });
}

const isInvalidProp = (key) => {
  return (
    key.startsWith("$") || key.startsWith("#") || key == "blocks" || !isNaN(key)
  );
};

function listProperties(data, partialpath) {
  if (!data) return;
  Object.keys(data).forEach((key) => {
    if (isInvalidProp(key)) return;

    if (!properties[key]) {
      properties[key] = {
        objects: [],
        array_objects: {},
        array_primitives: [],
        primitives: [],
        exemples: [],
      };
    }

    const relunch = (data_key) => {
      if (!data_key) return;
      const subpropsKeys = Object.keys(data_key);

      subpropsKeys.forEach((subpropsKey) => {
        if (isInvalidProp(subpropsKey)) return;

        if (!properties[key].objects.includes(subpropsKey)) {
          properties[key].objects.push(subpropsKey);
        }
        listProperties(data_key, partialpath);
      });
    };

    if (!properties[key].exemples.includes(partialpath)) {
      properties[key].exemples.push(partialpath);
    }

    if (!Array.isArray(data[key]) && typeof data[key] === "object") {
      relunch(data[key]);
    } else {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        data[key].forEach((subkeys) => {
          if (typeof subkeys === "object") {
            Object.keys(subkeys).forEach((subkey) => {
              if (isInvalidProp(subkey)) return;

              if (!properties[key].array_objects[subkey]) {
                properties[key].array_objects[subkey] = [];
              }

              let subkeyValue = subkeys[subkey];
              if (subkeyValue != null && typeof subkeyValue === "object") {
                // relunch(subkeys);
                //TODO
              } else {
                if (
                  !properties[key].array_objects[subkey].includes(subkeyValue)
                )
                  properties[key].array_objects[subkey].push(subkeyValue);
              }
            });
          } else {
            if (!properties[key].array_primitives.includes(subkeys))
              properties[key].array_primitives[subkeys].push(subkeys);
          }

          // if (!Array.isArray(value) && typeof value === "object") {
          //   relunch(data[key]);
          // } else if (value != null && typeof value !== "object") {
          //   otherSubProps.push(value);
          // }
          // otherSubProps.push(value);
        });

        // properties[key].datas.values = properties[key].datas.values.concat(otherSubProps);
        // if (!properties[key].datas.types.includes("array")) properties[key].datas.types.push("array");
      } else if (
        !properties[key].primitives.includes(data[key]) &&
        typeof data[key] !== "object"
      ) {
        properties[key].primitives.push(data[key]);
        // const type = typeof data[key];
        // if (!properties[key].datas.simple.types.includes(type))
        //   properties[key].datas.simple.types.push(type);
      }
    }
  });
}
