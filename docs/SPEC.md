# Symbolic MPC Specification v0.2

## Overview

This document provides the complete field reference for the Symbolic Model-Predictive Control (MPC) specification. Symbolic MPC is a lightweight, rolling-plan format designed for AI coding agents and their human partners to decompose work, execute the next node, then recompute the rest of the task graph on every step.

## Schema Validation

All Symbolic MPC plans must conform to the JSON Schema defined in `symbolic-mpc.schema.json`. Use a JSON Schema validator like `ajv-cli` to validate your plans:

```bash
ajv validate -s symbolic-mpc.schema.json -d your-plan.yaml
```

## File Format

Symbolic MPC plans are written in YAML format and should be named using the pattern: `<project>-symbolic-mpc.yaml`

## Top-Level Structure

### Required Fields

| Field           | Type   | Description                                       |
| --------------- | ------ | ------------------------------------------------- |
| `version`       | string | Specification version (currently "0.2")           |
| `plan_id`       | string | Unique identifier for this plan                   |
| `project_name`  | string | Human-readable project name                       |
| `agent_profile` | string | Target agent profile (e.g., "ai-coding-agent-v1") |
| `architecture`  | object | Architectural overview and constraints            |
| `tooling`       | object | Technology stack and standards                    |
| `entry_node`    | string | ID of the node where execution begins             |
| `nodes`         | array  | List of all plan nodes                            |

### Optional Fields

| Field     | Type   | Description                            |
| --------- | ------ | -------------------------------------- |
| `context` | object | Global context shared across all nodes |

## Context Object

The `context` object provides global information that agents can reference throughout plan execution.

### Optional Fields

| Field                         | Type           | Description                                |
| ----------------------------- | -------------- | ------------------------------------------ |
| `business_goal`               | string         | High-level business objective              |
| `non_functional_requirements` | array[string]  | Performance, cost, and quality constraints |
| `personas`                    | array[persona] | User personas and their needs              |

### Persona Object

| Field  | Type   | Description                                   |
| ------ | ------ | --------------------------------------------- |
| `name` | string | Persona name (e.g., "PM", "Backend Engineer") |
| `need` | string | What this persona needs from the system       |

## Architecture Object

Defines the overall system architecture and constraints.

### Required Fields

| Field      | Type   | Description                          |
| ---------- | ------ | ------------------------------------ |
| `overview` | string | High-level architectural description |

### Optional Fields

| Field                | Type          | Description                                |
| -------------------- | ------------- | ------------------------------------------ |
| `constraints`        | array[string] | Architectural limitations and requirements |
| `integration_points` | array[string] | External systems and interfaces            |

## Tooling Object

Specifies the technology stack and development standards.

### Required Fields

| Field              | Type          | Description                       |
| ------------------ | ------------- | --------------------------------- |
| `primary_language` | string        | Main programming language         |
| `frameworks`       | array[string] | Required frameworks and libraries |
| `package_manager`  | string        | Package management tool           |

### Optional Fields

| Field                 | Type          | Description                         |
| --------------------- | ------------- | ----------------------------------- |
| `secondary_languages` | array[string] | Additional languages used           |
| `coding_standards`    | object        | Code quality and style requirements |

### Coding Standards Object

| Field        | Type   | Description              |
| ------------ | ------ | ------------------------ |
| `lint`       | string | Linting configuration    |
| `formatting` | string | Code formatting standard |
| `testing`    | string | Testing requirements     |

## Node Object

Nodes represent individual work items in the plan. Each node should be atomic and executable by an AI agent.

### Required Fields

| Field                  | Type          | Description                              |
| ---------------------- | ------------- | ---------------------------------------- |
| `id`                   | string        | Unique node identifier                   |
| `materialization`      | number        | Commitment level (0.0-1.0)               |
| `description`          | string        | Brief, one-line description              |
| `detailed_description` | string        | Comprehensive execution guidance         |
| `outputs`              | array[string] | Expected deliverable file paths/patterns |
| `agent_action`         | string        | Specific action for the agent to take    |

### Optional Fields

| Field                 | Type          | Description                       |
| --------------------- | ------------- | --------------------------------- |
| `inputs`              | array[string] | Required input files/dependencies |
| `acceptance_criteria` | array[string] | Checklist for accepting the work  |
| `definition_of_done`  | string        | Clear completion criteria         |
| `required_knowledge`  | array[string] | Domain knowledge needed           |
| `downstream`          | array[string] | IDs of dependent nodes            |

## Field Details

### Materialization

The `materialization` field represents how "locked-in" a node is:

- **1.0**: Fully committed, execute immediately
- **0.7-0.9**: High confidence, minor adjustments possible
- **0.4-0.6**: Medium confidence, significant changes likely
- **0.0-0.3**: Low confidence, may be reordered or rewritten

### Node Descriptions

- **`description`**: Single sentence summary for quick scanning
- **`detailed_description`**: Multi-line guidance with enough detail for zero-clarification execution. Use YAML literal block syntax (`|`) for multi-line content.

### Inputs and Outputs

- **`inputs`**: Files, APIs, or artifacts this node depends on
- **`outputs`**: Files, APIs, or artifacts this node will create
- Use glob patterns where appropriate (e.g., `"api/handlers/*.ts"`)

### Acceptance Criteria

Bullet-point checklist that humans or CI systems can verify:

```yaml
acceptance_criteria:
  - "Local CDK synth succeeds with `cdk synth`"
  - "OpenAPI file validates with spectral"
  - "Handlers compile with no eslint errors"
```

### Agent Actions

Clear, actionable instructions for the AI agent:

- "Generate code + OpenAPI; push commit"
- "Write data access layer and update CDK app"
- "Generate tests"

## Graph Structure

Nodes form a directed acyclic graph (DAG) through the `downstream` field:

- Use node IDs to reference dependencies
- Avoid circular dependencies
- The `entry_node` should have `materialization: 1.0`

## Best Practices

### Planning Strategy

1. **Start concrete, get abstract**: Begin with high-materialization nodes for immediate execution
2. **Decay downstream**: Lower materialization values for future nodes to maintain flexibility
3. **Atomic nodes**: Each node should represent a single, completable unit of work

### Writing Descriptions

1. **Be specific**: Include exact commands, file names, and expected outputs
2. **Zero ambiguity**: Agent should never need clarification
3. **Context-aware**: Reference the global `context` and `architecture` when relevant

### Tool Integration

Structure outputs to work with common development tools:

```yaml
outputs: ["src/components/*.tsx", "src/types/api.ts"]
acceptance_criteria:
  - "`npm run typecheck` passes"
  - "`npm test` shows >95% coverage"
```

## Example Plan Structure

```yaml
version: "0.2"
plan_id: "example-001"
project_name: "Example Project"
agent_profile: "ai-coding-agent-v1"

context:
  business_goal: "Solve a specific problem efficiently"
  personas:
    - name: "Developer"
      need: "Clean, maintainable code"

architecture:
  overview: "Simple web application"
  constraints:
    - "No external dependencies"

tooling:
  primary_language: "TypeScript"
  frameworks: ["React", "Node.js"]
  package_manager: "npm"

entry_node: "setup-project"

nodes:
  - id: "setup-project"
    materialization: 1.0
    description: "Initialize project structure"
    detailed_description: |
      Create package.json, tsconfig.json, and basic folder structure.
      Use create-react-app for frontend bootstrapping.
    outputs: ["package.json", "src/", "public/"]
    agent_action: "Generate project scaffolding"
    downstream: ["implement-core-feature"]

  - id: "implement-core-feature"
    materialization: 0.8
    description: "Build main application feature"
    detailed_description: |
      Implement the core business logic based on requirements.
    inputs: ["package.json", "src/"]
    outputs: ["src/components/", "src/utils/"]
    agent_action: "Write feature implementation"
    downstream: []
```

## Version History

- **v0.2**: Current version with full schema specification
- **v0.1**: Initial draft specification

## References

1. Stanley, K. O., & Lehman, J. (2015). _Why Greatness Cannot Be Planned: The Myth of the Objective_. Springer.
2. Pheng, L. (2025). _Visualizing Task Breakdown: An Interactive Force-Directed Graph Approach to Task Management_. University of Virginia Technical Report.
