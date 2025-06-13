#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'llms.txt';

const TEMPLATE = `# Symbolic MPC - Essential Reference for Creating MPC Files

## Quick Start

To create a valid MPC file, you need:
1. Required top-level fields: version, plan_id, project_name, agent_profile, architecture, tooling, entry_node, nodes
2. Exactly one root node (a node with no incoming edges) 
3. The entry_node must be the root node
4. All nodes must have: id, status, materialization, description, detailed_description, outputs, agent_action

## Schema Structure

### Top-Level Fields
\`\`\`yaml
version: "0.4"
plan_id: "unique-identifier"
project_name: "Human-readable name"
agent_profile: "ai-coding-agent-v1"
entry_node: "root-node-id"  # Must be the root node

context:  # Optional
  business_goal: "High-level objective"
  non_functional_requirements: ["Performance", "Security"]
  personas:
    - name: "Developer"
      need: "Clean API"

architecture:
  overview: "System architecture description"  # Required
  constraints: ["No external deps"]  # Optional
  integration_points: ["External APIs"]  # Optional

tooling:
  primary_language: "TypeScript"  # Required
  frameworks: ["React", "Node.js"]  # Required, min 1
  package_manager: "npm"  # Required
  secondary_languages: ["SQL"]  # Optional
  coding_standards:  # Optional
    lint: "eslint"
    formatting: "prettier"
    testing: "jest"

nodes: []  # Array of node objects
\`\`\`

### Node Structure
\`\`\`yaml
- id: "unique-node-id"
  status: "Ready"  # Enum: Completed, Ready, In Progress, Blocked, Paused, Waiting
  materialization: 0.8  # 0.0-1.0, how committed this node is
  description: "Brief one-line description"
  detailed_description: |
    Multi-line detailed guidance for execution.
    Be specific about files, commands, and expected outcomes.
  outputs: ["src/file.ts", "api/*.js"]  # Required array
  agent_action: "Specific action for agent"  # Required
  
  # Optional fields
  inputs: ["dependency-files"]
  acceptance_criteria: ["Tests pass", "No lint errors"]
  definition_of_done: "Clear completion criteria"
  required_knowledge: ["React hooks", "AWS CDK"]
  downstream: ["next-node-id", "another-node-id"]
\`\`\`

## Key Rules

1. **Graph Structure**: Must have exactly one root node (no incoming edges)
2. **Entry Node**: Must be the root node
3. **Materialization**: Entry node should have 1.0, downstream nodes lower
4. **Status Values**: Use correct enum values
5. **Downstream References**: All referenced node IDs must exist

## Minimal Valid Example

\`\`\`yaml
version: "0.4"
plan_id: "minimal-001"
project_name: "Minimal Example"
agent_profile: "ai-coding-agent-v1"
architecture:
  overview: "Simple application"
tooling:
  primary_language: "JavaScript"
  frameworks: ["Node.js"]
  package_manager: "npm"
entry_node: "setup"
nodes:
  - id: "setup"
    status: "Ready"
    materialization: 1.0
    description: "Initialize project"
    detailed_description: "Create package.json and basic structure"
    outputs: ["package.json"]
    agent_action: "Generate project files"
    downstream: ["implement"]
  - id: "implement"
    status: "Blocked"
    materialization: 0.7
    description: "Implement core feature"
    detailed_description: "Build the main functionality"
    outputs: ["src/index.js"]
    agent_action: "Write implementation"
\`\`\`

## Full Example Structure

{{FEATURE_FLAGS_CONTENT}}
`;

function readFileContent(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return `[Error reading ${filePath}: ${error.message}]`;
  }
}

function generateLlmsTxt() {
  console.log('Generating llms.txt with embedded file contents...');
  
  const replacements = {
    '{{FEATURE_FLAGS_CONTENT}}': readFileContent('examples/feature-flags-backend.yaml')
  };
  
  let content = TEMPLATE;
  
  for (const [placeholder, fileContent] of Object.entries(replacements)) {
    content = content.replace(placeholder, fileContent);
  }
  
  fs.writeFileSync(OUTPUT_FILE, content);
  console.log(`✅ Generated ${OUTPUT_FILE} with all embedded content`);
  
  const stats = fs.statSync(OUTPUT_FILE);
  console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
}

if (require.main === module) {
  generateLlmsTxt();
}

module.exports = { generateLlmsTxt };