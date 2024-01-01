const _ = require('lodash')

function getParentNodeData (nodeId) {
  const res = {
    id: '',
    branch: 'main'
  }

  if (nodeId.toString().indexOf('/') >= 0) {
    const info = nodeId.split('/')
    res.id = parseInt(info[0])
    res.branch = info[1]
  } else res.id = nodeId

  return res
}

function getNodeConnections (nodes, nodeId) {
  const connections = []
  for (const node of nodes) {
    if (!_.isNil(nodeId) && nodeId === node.id) continue
    if (node.type === 'end') continue

    if (node.type === 'condition') {
      connections.push({
        value: node.id + '/yes'
      })
      connections.push({
        value: node.id + '/no'
      })
    } else {
      connections.push({
        value: node.id.toString()
      })
    }
  }

  return connections
}

function directDescendant (id1, id2, nodes) {
  const node1 = _.find(nodes, { id: parseInt(id1) })
  const node2 = _.find(nodes, { id: parseInt(id2) })

  // A node is not a direct descendant of itself
  if (node1.id === node2.id) return false

  for (const parent of node1.parents) {
    if (parent.id === id2 || directDescendant(parent.id, id2, nodes)) return true
  }

  return false
}

function directSuccessor (id1, id2, nodes) {
  const node1 = _.find(nodes, { id: parseInt(id1) })
  const node2 = _.find(nodes, { id: parseInt(id2) })

  if (node1.id === node2.id) return false

  if (node1.children.main < 0) return false

  if (node1.children.main === id2) return true

  return directSuccessor(node1.children.main, id2, nodes)
}

function getDisabledParents (node, nodes, potentialParents) {
  const disabledParents = {}
  const currentlyConnectedParents = []

  for (const conn in potentialParents) {
    let connNodeId = conn
    if (conn.indexOf('/') >= 0) connNodeId = conn.split('/')[0]

    if (potentialParents[conn]) {
      currentlyConnectedParents.push(connNodeId)
    }
  }

  for (const conn in potentialParents) {
    let disabled = false
    let connNodeId = conn
    if (conn.indexOf('/') >= 0) connNodeId = conn.split('/')[0]

    for (const ccp of currentlyConnectedParents) {
      const dirDesc = directDescendant(parseInt(ccp), parseInt(connNodeId), nodes)
      const dirSuc = directSuccessor(parseInt(ccp), parseInt(connNodeId), nodes)
      if (dirDesc || dirSuc) disabled = true
    }

    disabledParents[conn] = disabled
  }

  return disabledParents
}

function getSelectedAndDisabledParents (node, nodes, parents) {
  const selectedParents = {}
  const currentlySelectedParents = []

  for (const conn of getNodeConnections(nodes)) {
    let parentId = -1
    let branch = 'main'
    if (conn.value.indexOf('/') >= 0) {
      parentId = parseInt(conn.value.split('/')[0])
      branch = conn.value.split('/')[1]
    } else parentId = parseInt(conn.value)

    if (_.isNil(parents)) {
      selectedParents[conn.value] = false
    } else {
      const parentObj = _.find(parents, p => { return !_.isNil(p) && !_.isNil(p.node) && (p.node.id === parentId) })
      if (_.isNil(parentObj) || (parentObj.branch !== branch)) {
        selectedParents[conn.value] = false
      } else {
        selectedParents[conn.value] = true
        currentlySelectedParents.push({ id: parentId, branch: branch })
      }
    }
  }
  const disabledParents = getDisabledParents(node, nodes, selectedParents)

  return {
    selectedParents,
    disabledParents,
    currentlySelectedParents
  }
}

function selectParents (node, nodes, selectedParents) {
  const currentlySelectedParents = []
  for (const parent in selectedParents) {
    const newParent = {
      id: parseInt(parent),
      branch: 'main'
    }
    if (parent.indexOf('/') >= 0) {
      newParent.id = parseInt(parent.split('/')[0])
      newParent.branch = parent.split('/')[1]
    }
    if (selectedParents[parent]) currentlySelectedParents.push(newParent)
  }
  const disabledParents = getDisabledParents(node, nodes, selectedParents)

  return {
    selectedParents,
    disabledParents,
    currentlySelectedParents
  }
}

function assignParentsOnReset (state, node, nodes, parents) {
  const sdParents = getSelectedAndDisabledParents(node, nodes, parents)
  state.selectedParents = sdParents.selectedParents
  state.disabledParents = sdParents.disabledParents
  state.currentlySelectedParents = sdParents.currentlySelectedParents
}

function checkIfSameParents (oldParents, newParents) {
  if (oldParents.length !== newParents.length) return false
  for (const parent of oldParents) {
    if (_.isNil(_.find(newParents, { id: parent.id }))) return false
  }

  return true
}

function checkIfOnlyAddingParents (oldParents, newParents) {
  const oldParentsIds = _.map(oldParents, p => { return p.id })
  const newParentsIds = _.map(newParents, p => { return p.id })

  for (const pId of oldParentsIds) {
    if (newParentsIds.indexOf(pId) < 0) return false
  }

  return true
}

function translateMemoryStateToHtml (memoryState) {
  let htmlStr = '<p style="font-family=monospace;">'
  for (const varName in memoryState.memory) {
    let varType = 'int'
    if (typeof memoryState.memory[varName] === 'boolean') varType = 'bool'
    else if (Array.isArray(memoryState.memory[varName])) varType = 'collection'
    htmlStr += varName + '&nbsp;=&nbsp;' + getVariableStringRepresentation(varType, memoryState.memory[varName]) + '<br/>'
  }
  htmlStr += '</p>'

  return htmlStr
}

function getVariableStringRepresentation (type, value) {
  if (type === 'collection') return JSON.stringify(value)
  else return value
}

const varNameValidateRegex = /^[a-zA-Z][a-zA-Z\d]*$/
const forbiddenNames = ['new', 'var', 'const', 'let', 'function', 'window', 'document', 'cookie']

function validateVariableOrFunctionName (name) {
  if (name === '') return true

  if (
      varNameValidateRegex.test(name) &&
      forbiddenNames.indexOf(name) < 0
    ) return true
  return false
}

module.exports = {
  getNodeConnections,
  getParentNodeData,
  getDisabledParents,
  getSelectedAndDisabledParents,
  selectParents,
  assignParentsOnReset,
  checkIfSameParents,
  checkIfOnlyAddingParents,
  translateMemoryStateToHtml,
  getVariableStringRepresentation,
  validateVariableOrFunctionName
}
