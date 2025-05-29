# Symbolic MPC Specification

**Symbolic Model‑Predictive Control (MPC)** is a lightweight, rolling‑plan format that lets an AI coding agent (and its human partner) decompose work, execute the next node, then recompute the rest of the task graph on every step.

This repo contains the JSON Schema (`symbolic-mpc.schema.json`) and reference materials so you can create and validate your own `*-symbolic-mpc.yaml` plans.

## Why Symbolic MPC?

| Classic PRD Pain       | Symbolic MPC Fix                                            |
| ---------------------- | ----------------------------------------------------------- |
| Waterfall, monolithic  | Rolling‑horizon planning; only the next node is locked‑in   |
| Human‑only audience    | Written for LLM agents **and** humans                       |
| Milestones & schedules | Omitted by design; focus stays on code‑generation tasks     |
| Free‑form prose        | Strict, machine‑checkable fields with optional rich context |

## Philosophy

In robotics, Model Predictive Control (MPC) plans a full trajectory, executes a single control input, then replans from the new state, a rolling-horizon strategy that keeps the robot agile in uncertain environments. Materialization brings that same principle to software planning: every node carries a 0-to-1 score expressing how "locked-in" it is. The entry node (≈ 1.0) is executed with confidence, while downstream nodes decay toward 0, signaling increasing openness to change. This quantifies the insight from Why Greatness Cannot Be Planned[^1]: rigid end-to-end blueprints invite failure, whereas flexible, step-wise commitments let emergent opportunities guide the path to success.

[^1]: Stanley, K. O., & Lehman, J. (2015). _Why Greatness Cannot Be Planned: The Myth of the Objective_. Springer. [https://link.springer.com/book/10.1007/978-3-319-15524-1](https://link.springer.com/book/10.1007/978-3-319-15524-1)

This project is also inspired by _Visualizing Task Breakdown: An Interactive Force-Directed Graph Approach to Task Management_ [Pheng (2025)](https://libraetd.lib.virginia.edu/downloads/7m01bn343?filename=Pheng_Lanah_Technical_Report.pdf).

## Repo Contents

```
.
├── symbolic-mpc.schema.json   # JSON Schema (draft‑2020‑12)
├── llm.txt                   # LLM context for generating schemas
├── example/
│   └── feature-flags-symbolic-mpc.yaml
└── docs/
    └── SPEC.md               # Full field reference
```

### LLM Context File

The `llm.txt` file provides comprehensive context about the Symbolic MPC specification for Large Language Models. This file contains the complete schema documentation, examples, and best practices to help LLMs generate valid Symbolic MPC YAML files without needing additional context or clarification.

## Quick Start

### 1. Clone & install a JSON‑Schema validator

```bash
git clone https://github.com/mattbarlow-sg/symbolic-mpc.git
cd symbolic-mpc
npm i
```

### 2. Create a plan file

Name it `<project>-symbolic-mpc.yaml`:

```yaml
version: "0.3"
plan_id: "ff-backend-001"
project_name: "Feature Flags Backend"
agent_profile: "ai-coding-agent-v1"
entry_node: "define-feature-flag-api"
nodes:
  - id: "define-feature-flag-api"
    materialization: 1.0
    description: "Create REST endpoints to CRUD feature flags."
    detailed_description: |
      Three routes: POST /flags, GET /flags/{id}, GET /flags
    outputs: ["api/handlers/*.ts"]
    agent_action: "Generate code + OpenAPI"
    downstream: ["write-unit-tests"]
```

### 3. Validate

```bash
node test-schema.js your-project-symbolic-mpc.yaml
```

If the plan is valid, you’re ready to feed the **entry node** to your AI coding agent.

## Key Concepts

| Field                  | Purpose                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `materialization`      | **0–1 float** — how "locked‑in" the node is. The agent may reorder or rewrite nodes with values < 1. |
| `detailed_description` | Paragraph‑level guidance so the agent can act with **zero clarification**.                           |
| `acceptance_criteria`  | Bullet list the human (or CI) will check before accepting the node’s PR.                             |
| `downstream`           | Forward pointers to dependent nodes; the graph is acyclic by convention.                             |

See **`docs/SPEC.md`** for the full field reference.

## Contribution Guide

1. Fork and create a feature branch.
2. Update **`symbolic-mpc.schema.json`** or docs.
3. Run `npm test` (schema & sample linting).
4. Open a PR; one of the maintainers will review.

## Roadmap

- **v0.3** — Typed reference implementation in TypeScript (plan loader + decay heuristic).
- **v0.4** — CLI scaffolder (`mpc init`) to bootstrap new plans.
- **v1.0** — Stable spec; backwards‑compat promise.

## License

MIT © 2025 Matt Barlow
