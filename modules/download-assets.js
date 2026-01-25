import { spawn } from "child_process";
import extract from "extract-zip";
import fs from "fs";
import path from "path";

let __dirname = import.meta.dirname;
let __rootname = path.join(__dirname, "../");

const downloadfolder = "downloads";
const downloadfile = "game.zip";
const downloadassets = "Assets.zip";
const extractedname = "gamextracted";
const datafolder = "data";
const gamefolder = "game";

if (!fs.existsSync(downloadfolder)) fs.mkdirSync(downloadfolder);
if (!fs.existsSync(datafolder)) fs.mkdirSync(datafolder);

console.log("Downloading game files...");

// const child = spawn("modules/downloader/hytale-downloader-linux-amd64", [
//   "-download-path",
//   downloadfolder + "/" + downloadfile,
// ]);

// child.stdout.on("data", (chunk) => {
//   console.log(chunk.toString());
// });

// child.on("close", (code) => {
//   if (code === 0) {
//     extractZip().then(() => {
//       console.log("Downloading files complete");
//       process.exit(0);
//     });
//   } else {
//     console.log("Download failed");
//   }
// });

async function extractZip() {
  return new Promise(async (resolve, reject) => {
    // await extract(
    //   path.join(__rootname, downloadfolder, downloadfile),
    //   { dir: path.join(__rootname, downloadfolder, extractedname) },
    //   (err) => {
    //     if (err) {
    //       reject(err);
    //     }
    //   },
    // );

    const assteszip = path.join(
      __rootname,
      downloadfolder,
      extractedname,
      downloadassets,
    );
    await extract(
      assteszip,
      { dir: path.join(__rootname, datafolder, gamefolder) },
      (err) => {
        if (!err) {
          reject(err);
        }
      },
    );

    resolve();
  });
}

extractZip().then(() => {
  console.log("Downloading files complete");
  process.exit(0);
});
