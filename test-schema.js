#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const schema = JSON.parse(fs.readFileSync('symbolic-mpc.schema.json', 'utf8'));

const yamlContent = fs.readFileSync('examples/feature-flags-backend.yaml', 'utf8');
const data = yaml.load(yamlContent);

const ajv = new Ajv({ strict: false, validateSchema: false });
addFormats(ajv);

const validate = ajv.compile(schema);

const valid = validate(data);

if (valid) {
    console.log('✅ Example file validates against the schema');
    process.exit(0);
} else {
    console.log('❌ Validation failed:');
    console.log(JSON.stringify(validate.errors, null, 2));
    process.exit(1);
}
