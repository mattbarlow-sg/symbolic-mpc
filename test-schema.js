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

function validateSingleRootNode(data) {
  if (!data.nodes || !Array.isArray(data.nodes)) {
    return { valid: false, error: "No nodes array found" };
  }

  // Build a set of all node IDs that are referenced as downstream
  const referencedNodes = new Set();

  for (const node of data.nodes) {
    if (node.downstream && Array.isArray(node.downstream)) {
      for (const downstreamId of node.downstream) {
        referencedNodes.add(downstreamId);
      }
    }
  }

  // Find all nodes that are not referenced (root nodes)
  const rootNodes = data.nodes.filter((node) => !referencedNodes.has(node.id));

  if (rootNodes.length === 0) {
    return {
      valid: false,
      error: "No root node found (all nodes have incoming edges)",
    };
  } else if (rootNodes.length > 1) {
    const rootIds = rootNodes.map((n) => n.id).join(", ");
    return {
      valid: false,
      error: `Multiple root nodes found: ${rootIds}. There must be exactly one root node.`,
    };
  }

  // Verify that the entry_node is the root node
  const rootNode = rootNodes[0];
  if (data.entry_node !== rootNode.id) {
    return {
      valid: false,
      error: `entry_node "${data.entry_node}" is not the root node. The root node is "${rootNode.id}".`,
    };
  }

  return { valid: true };
}

function validateFile(filePath) {
  try {
    const yamlContent = fs.readFileSync(filePath, "utf8");
    const data = yaml.load(yamlContent);

    const valid = validate(data);

    if (!valid) {
      console.log(`❌ ${filePath} validation failed:`);
      console.log(JSON.stringify(validate.errors, null, 2));
      return false;
    }

    // Additional validation: Check for exactly one root node
    const rootNodeValidation = validateSingleRootNode(data);
    if (!rootNodeValidation.valid) {
      console.log(`❌ ${filePath} graph structure validation failed:`);
      console.log(`   ${rootNodeValidation.error}`);
      return false;
    }

    console.log(`✅ ${filePath} validates against the schema`);
    return true;
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
