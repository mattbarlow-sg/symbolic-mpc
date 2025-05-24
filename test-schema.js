#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const schema = JSON.parse(fs.readFileSync("symbolic-mpc.schema.json", "utf8"));

const ajv = new Ajv({ strict: false, validateSchema: false });
addFormats(ajv);
const validate = ajv.compile(schema);

function validateFile(filePath) {
  try {
    const yamlContent = fs.readFileSync(filePath, "utf8");
    const data = yaml.load(yamlContent);

    const valid = validate(data);

    if (valid) {
      console.log(`✅ ${filePath} validates against the schema`);
      return true;
    } else {
      console.log(`❌ ${filePath} validation failed:`);
      console.log(JSON.stringify(validate.errors, null, 2));
      return false;
    }
  } catch (error) {
    console.log(`❌ Error validating ${filePath}: ${error.message}`);
    return false;
  }
}

// If a specific file is provided, validate just that file
if (process.argv[2]) {
  const isValid = validateFile(process.argv[2]);
  process.exit(isValid ? 0 : 1);
}

// Otherwise, validate all example files
const examplesDir = "examples";
if (!fs.existsSync(examplesDir)) {
  console.log("❌ Examples directory not found");
  process.exit(1);
}

const files = fs
  .readdirSync(examplesDir)
  .filter((file) => file.endsWith(".yaml") || file.endsWith(".yml"))
  .map((file) => path.join(examplesDir, file));

if (files.length === 0) {
  console.log("❌ No YAML files found in examples directory");
  process.exit(1);
}

let allValid = true;
for (const file of files) {
  const isValid = validateFile(file);
  allValid = allValid && isValid;
}

process.exit(allValid ? 0 : 1);
