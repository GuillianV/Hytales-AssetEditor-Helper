import fs from "fs";
import path from "path";

const __dirname = import.meta.dirname;
let __rootname = path.join(__dirname, "../");
const datafolder = "data";
const gamefolder = "game";
const serverfolder = path.join(__rootname, datafolder, gamefolder, "Server");
const referencesfolder = path.join(__rootname, datafolder, "server-assets-references");
if (!fs.existsSync(referencesfolder)) fs.mkdirSync(referencesfolder, { recursive: true });

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
  const fulldatas = [];
  const regex = /"([^"]*)"/g;
  for (let index = 0; index < results.length; index++) {
    const result = results[index];
    const fullpath = result.file;
    const filename = result.filename;

    if (!filename.endsWith(".json") || filename.endsWith("BranchInfo.json") || filename.endsWith(".node.json")) continue;

    const partialpath = fullpath.replace(assetsPath, "");

    let data;
    let keywords = [];
    try {
      data = fs.readFileSync(fullpath, "utf8");
      data = data.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => (g ? "" : m));
      keywords = data.match(regex).map((match) => match.slice(1, -1));
    } catch (_) {
      errorPaths.push(fullpath);
    }
    if (!data) continue;

    console.log("Loading : " + index + "/" + results.length + " - " + partialpath);
    fulldatas.push({ filename, partialpath, data, keywords });
  }

  console.log(fulldatas);
  findReferences(fulldatas);
}

function findReferences(fulldatas) {
  const references = {};

  const entrieslength = fulldatas.length;
  for (let index = 0; index < entrieslength; index++) {
    const data = fulldatas[index];
    const filename = data.filename;
    console.log("Checking refs " + index + "/" + entrieslength + " - " + filename);
    fulldatas.forEach((sub_data) => {
      if (sub_data.keywords.includes(filename.replace(".json", ""))) {
        if (!references[data.partialpath])
          references[data.partialpath] = {
            references: [],
            filename,
            partialpath: data.partialpath,
            key: data.partialpath.replaceAll("\\", "$"),
          };
        references[data.partialpath].references.push(sub_data.partialpath);
      }
    });
    if (references[data.partialpath]) {
      fs.writeFileSync(`${referencesfolder}/${references[data.partialpath].key}`, JSON.stringify(references[data.partialpath], null, 2), { encoding: "utf8" });
    }else {
        console.log("No references found for " + data.partialpath);
    }
  }
}
