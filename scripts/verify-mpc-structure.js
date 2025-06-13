#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Parse command line arguments
const args = process.argv.slice(2);
const filePath = args[0] || 'docs/symbolic-mpc-bugfixes.yaml';

// Check if file exists
if (!fs.existsSync(filePath)) {
  console.error(`Error: File not found: ${filePath}`);
  process.exit(1);
}

try {
  // Read and parse YAML file
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const data = yaml.load(fileContents);

  console.log(`\nVerifying MPC structure for: ${filePath}`);
  console.log('=' + '='.repeat(50));

  // Check if nodes exist
  if (!data.nodes || !Array.isArray(data.nodes)) {
    console.error('Error: No nodes array found in YAML file');
    process.exit(1);
  }

  // Create a map of all nodes
  const nodeMap = new Map();
  const childToParents = new Map(); // Track which nodes reference each node as downstream

  // First pass: build node map
  data.nodes.forEach(node => {
    nodeMap.set(node.id, node);
  });

  // Second pass: build parent-child relationships
  data.nodes.forEach(node => {
    if (node.downstream && Array.isArray(node.downstream)) {
      node.downstream.forEach(childId => {
        if (!childToParents.has(childId)) {
          childToParents.set(childId, []);
        }
        childToParents.get(childId).push(node.id);
      });
    }
  });

  // Find root nodes (nodes that are not referenced by any other node)
  const rootNodes = [];
  data.nodes.forEach(node => {
    if (!childToParents.has(node.id)) {
      rootNodes.push(node);
    }
  });

  // Display results
  console.log(`\nTotal nodes: ${data.nodes.length}`);
  console.log(`Root nodes found: ${rootNodes.length}`);
  
  if (rootNodes.length === 0) {
    console.error('\n❌ ERROR: No root nodes found! The graph might have cycles.');
  } else if (rootNodes.length === 1) {
    console.log('\n✅ SUCCESS: Exactly one root node found!');
    console.log(`   Root node ID: "${rootNodes[0].id}"`);
    console.log(`   Description: "${rootNodes[0].description}"`);
    
    // Verify entry_node matches
    if (data.entry_node) {
      if (data.entry_node === rootNodes[0].id) {
        console.log(`   ✅ entry_node correctly points to root: "${data.entry_node}"`);
      } else {
        console.log(`   ⚠️  WARNING: entry_node "${data.entry_node}" doesn't match root node "${rootNodes[0].id}"`);
      }
    }
  } else {
    console.error('\n❌ ERROR: Multiple root nodes found!');
    console.log('   The following nodes have no parents:');
    rootNodes.forEach(node => {
      console.log(`   - "${node.id}": ${node.description}`);
    });
  }

  // Additional checks
  console.log('\n--- Additional Checks ---');

  // Check for orphaned nodes (nodes not connected to root)
  const visited = new Set();
  const queue = rootNodes.map(n => n.id);
  
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    const node = nodeMap.get(nodeId);
    if (node && node.downstream) {
      node.downstream.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push(childId);
        }
      });
    }
  }

  const orphanedNodes = data.nodes.filter(node => !visited.has(node.id));
  if (orphanedNodes.length > 0) {
    console.log(`\n⚠️  WARNING: ${orphanedNodes.length} orphaned nodes found (not reachable from root):`);
    orphanedNodes.forEach(node => {
      console.log(`   - "${node.id}": ${node.description}`);
    });
  } else {
    console.log('✅ All nodes are reachable from root');
  }

  // Check for nodes with multiple parents
  const multiParentNodes = [];
  childToParents.forEach((parents, childId) => {
    if (parents.length > 1) {
      multiParentNodes.push({ id: childId, parents });
    }
  });

  if (multiParentNodes.length > 0) {
    console.log(`\n⚠️  Note: ${multiParentNodes.length} nodes have multiple parents:`);
    multiParentNodes.forEach(({ id, parents }) => {
      console.log(`   - "${id}" is referenced by: ${parents.map(p => `"${p}"`).join(', ')}`);
    });
  }

  // Check for missing node references
  const missingRefs = [];
  data.nodes.forEach(node => {
    if (node.downstream) {
      node.downstream.forEach(childId => {
        if (!nodeMap.has(childId)) {
          missingRefs.push({ parent: node.id, missing: childId });
        }
      });
    }
  });

  if (missingRefs.length > 0) {
    console.log(`\n❌ ERROR: ${missingRefs.length} missing node references found:`);
    missingRefs.forEach(({ parent, missing }) => {
      console.log(`   - Node "${parent}" references non-existent node "${missing}"`);
    });
  }

  console.log('\n' + '='.repeat(50));
  
  // Exit with appropriate code
  if (rootNodes.length === 1 && orphanedNodes.length === 0 && missingRefs.length === 0) {
    console.log('✅ MPC structure is valid!\n');
    process.exit(0);
  } else {
    console.log('❌ MPC structure has issues that need to be fixed.\n');
    process.exit(1);
  }

} catch (error) {
  console.error('Error parsing YAML file:', error.message);
  process.exit(1);
}