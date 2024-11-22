const zipFolder = require("zip-folder");
let folderName = "./build";

let zipName = "extension.zip";

zipFolder(folderName, zipName, function (err) {
  if (err) {
    console.log("oh no!", err);
  } else {
    console.log(
      `Successfully zipped the ${folderName} directory and store as ${zipName}`
    );
  }
});