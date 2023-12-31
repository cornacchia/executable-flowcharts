const _ = require('lodash')
const utils = require('./utils')

let ID = 0
let NOP_ID = 10000

const NODES = {
  start: {
    type: 'start',
    nodeType: 'start'
  },
  end: {
    type: 'end',
    nodeType: 'end'
  },
  variable: {
    type: 'variable',
    nodeType: 'operation'
  },
  expression: {
    type: 'expression',
    nodeType: 'operation'
  },
  condition: {
    type: 'condition',
    nodeType: 'condition'
  },
  loop: {
    type: 'loop',
    nodeType: 'condition'
  },
  nop: {
    type: 'nop',
    nodeType: 'operation'
  },
  nopNoModal: {
    type: 'nopNoModal',
    nodeType: 'operation'
  },
  output: {
    type: 'output',
    nodeType: 'inputoutput'
  },
  functionCall: {
    type: 'functionCall',
    nodeType: 'subroutine'
  },
  returnValue: {
    type: 'returnValue',
    nodeType: 'operation'
  },
  readParameters: {
    type: 'readParameters',
    nodeType: 'operation'
  }
}

const replaceSymbols = {
  '>=': '≥',
  '<=': '≤'
}

function cleanupExpression (expression) {
  let cleanExpression = expression
  for (const sym in replaceSymbols) {
    cleanExpression = cleanExpression.replaceAll(sym, replaceSymbols[sym])
  }
  return cleanExpression
}

function getNodeText (type, data) {
  let newNodeText = ''
  if (type === 'start') {
    newNodeText = 'Start'
  } else if (type === 'end') {
    newNodeText = 'End'
  } else if (type === 'variable') {
    for (let i = 0; i < data.variables.length; i++) {
      const variable = data.variables[i]
      newNodeText += variable.name + ' = ' + utils.getVariableStringRepresentation(variable.type, variable.value)
      if (i < data.variables.length - 1) newNodeText += '\n'
    }
  } else if (type === 'expression') {
    for (const expression of data.expressions) {
      newNodeText += cleanupExpression(expression) + '\n'
    }
  } else if (type === 'condition') {
    newNodeText += cleanupExpression(data.condition)
  } else if (type === 'loop') {
    newNodeText += cleanupExpression(data.condition)
  } else if (type === 'output') {
    newNodeText += 'output "' + data.output + '"'
  } else if (type === 'functionCall') {
    if (data.assignReturnValTo) {
      newNodeText += data.assignReturnValTo + ' = '
    }
    newNodeText += data.functionName
    newNodeText += '('
    for (let i = 0; i < data.functionParameters.length; i++) {
      newNodeText += data.functionParameters[i].value
      if (i < data.functionParameters.length - 1) newNodeText += ', '
    }
    newNodeText += ')'
  } else if (type === 'returnValue') {
    newNodeText += 'return = ' + JSON.stringify(data.returnValue)
  } else if (type === 'readParameters') {
    for (let i = 0; i < data.variables.length; i++) {
      const variable = data.variables[i]
      newNodeText += variable.name + ' = parametri[' + variable.value + ']'
      if (i < data.variables.length - 1) newNodeText += '\n'
    }
  }

  return newNodeText
}

function getNodeHtml (type, data) {
  const nodeText = getNodeText(type, data)
  const nodeHtml = nodeText.replaceAll('\n', '<br/>')
  return nodeHtml
}

function createNewNode (type) {
  const newNode = _.cloneDeep(NODES[type])
  newNode.id = ++ID
  newNode.parents = []
  newNode.children = { main: -1 }
  newNode.selected = false

  return newNode
}

function getNopNode (parent, type) {
  const newNode = _.cloneDeep(NODES[type])
  newNode.id = ++NOP_ID
  newNode.nopFor = parent.id
  newNode.parents = []
  newNode.children = { main: -1 }
  newNode.selected = false

  return newNode
}

function getNewNode (type, data) {
  if (!NODES[type]) console.error('Not implemented!')

  const newNode = createNewNode(type)
  const result = [ newNode ]

  if (type === 'variable') {
    newNode.variables = _.cloneDeep(data.variables)
  } else if (type === 'expression') {
    newNode.expressions = data.expressions
  } else if (type === 'condition') {
    const closeConditionNode = getNopNode(newNode, 'nop')
    closeConditionNode.parents.push({ id: newNode.id, branch: 'yes' })
    closeConditionNode.parents.push({ id: newNode.id, branch: 'no' })
    newNode.children = {
      yes: closeConditionNode.id,
      no: closeConditionNode.id,
      main: -1
    }

    newNode.condition = data.condition


    result.push(closeConditionNode)
  } else if (type === 'loop') {
    const loopRestartNode = getNopNode(newNode, 'nopNoModal')
    const loopEndNode = getNopNode(newNode, 'nop')
    loopRestartNode.parents.push({ id: newNode.id, branch: 'yes' })
    loopRestartNode.children.main = newNode.id

    loopEndNode.parents.push({ id: newNode.id, branch: 'no' })

    newNode.children = {
      yes: loopRestartNode.id,
      no: loopEndNode.id,
      main: -1
    }

    newNode.condition = data.condition
    result.push(loopRestartNode)
    result.push(loopEndNode)
  } else if (type === 'output') {
    newNode.output = data.output
  } else if (type === 'functionCall') {
    newNode.functionName = data.functionName
    newNode.assignReturnValTo = data.assignReturnValTo
    newNode.functionParameters = _.cloneDeep(data.functionParameters)
  } else if (type === 'returnValue') {
    newNode.returnType = data.returnType
    newNode.returnValue = data.returnValue
  } else if (type === 'readParameters') {
    newNode.variables = _.cloneDeep(data.variables)
  }

  return result
}

function updateNodeContents (nodeObj, data) {
  if (nodeObj.type === 'variable') {
    nodeObj.variables = _.cloneDeep(data.variables)
  } else if (nodeObj.type === 'expression') {
    nodeObj.expressions = data.expressions
  } else if (nodeObj.type === 'condition') {
    nodeObj.condition = data.condition
  } else if (nodeObj.type === 'loop') {
    nodeObj.condition = data.condition
  } else if (nodeObj.type === 'output') {
    nodeObj.output = data.output
  } else if (nodeObj.type === 'functionCall') {
    nodeObj.functionName = data.functionName
    nodeObj.assignReturnValTo = data.assignReturnValTo
    nodeObj.functionParameters = _.cloneDeep(data.functionParameters)
  } else if (nodeObj.type === 'returnValue') {
    nodeObj.returnType = data.returnType
    nodeObj.returnValue = data.returnValue
  } else if (nodeObj.type === 'readParameters') {
    nodeObj.variables = _.cloneDeep(data.variables)
  }

  return nodeObj
}

function hasChildren (node) {
  if (node.nodeType !== 'condition' && node.children.main >= 0) return true
  if (node.nodeType === 'condition' && node.children.yes >= 0) return true
  if (node.nodeType === 'condition' && node.children.no >= 0) return true
  return false
}

function connectGraphs (parent, branch, childGraph, nodes) {
  // >>> Handle previous child, part 1
  // Check if parent had previous child on the same branch
  // Remove that child from the parent's successors but keep it in order to attach it
  // to child graph exit point
  let previousChild = null
  if (parent.children[branch] >= 0) {
    previousChild = _.find(nodes, { id: parent.children[branch] })
    // Remove parent from previous child's parents
    _.remove(previousChild.parents, { id: parent.id })
  }
  // Remove previous child from parent's children
  parent.children[branch] = -1

  // # Previous child disconnected from parent

  // >>> Handle child graph entry point connection to parent
  // Add new parent to child graph entry point
  childGraph.entry.parents.push({ id: parent.id, branch: branch })
  // Add new child to new parent
  parent.children[branch] = childGraph.entry.id

  // # Connection to entry point done

  // >>> Handle previous child, part 2
  if (!_.isNil(previousChild)) {
    // NOTE: child graphs exit points are always "operation" nodes
    // that can only have children on branch "main"

    // Add previous child as children to child graph exit point
    childGraph.exit.children.main = previousChild.id
    previousChild.parents.push({ id: childGraph.exit.id, branch: 'main' })

    // # Connection o exit point done, previous child handled
  }
}

function connectNodes (parent, branch, child, nodes) {
  // Check if parent and child are already connected -> in that case do nothing
  if (parent.children[branch] === child.id) {
    return
  }

  // Check if parent had previous child on the same branch
  let previousChild = null
  if (parent.children[branch] >= 0) {
    previousChild = _.find(nodes, { id: parent.children[branch] })
    // Remove parent from previous child's parents
  _.remove(previousChild.parents, { id: parent.id })
  }
  // Remove previous child from parent's children
  parent.children[branch] = -1

  const childPreviousParents = _.cloneDeep(child.parents)
  // Remove previous parent (same branch) from new child, if present
  _.remove(child.parents, { branch: branch })
  // Add new parent to new child
  child.parents.push({ id: parent.id, branch: branch })

  // Add new child to new parent
  parent.children[branch] = child.id


  if (!_.isNil(previousChild)) {
    if (!hasChildren(child)) {
      // If new child has no children then we can attach any previous child
      // to its "main", "yes" and "no" branches
      if (child.nodeType !== 'condition') {
        connectNodes(child, 'main', previousChild, nodes)
      } else {
        // TO VERIFY, probably best to directly connect both branches
        connectNodes(child, 'yes', previousChild, nodes)
        connectNodes(child, 'no', previousChild, nodes)
      }
    } else {
      // New child has children of its own

    }
  } else {
    // Parent node has no children, this should never happen
  }

  /*
  if (!_.isNil(previousChild)) {
    // console.log('!!! There is a previous child')
    if (child.nodeType !== 'condition') connectNodes(child, 'main', previousChild, nodes)
    // else previousChild.parents = _.filter(previousChild.parents, n => { return n.id !== parent.id })
    else connectNodes(child, 'yes', previousChild, nodes)
  } else if (['end', 'condition'].indexOf(child.nodeType) < 0 && child.children.main < 0) {
    // console.log('!!! New child was attached at the end')
    const endNode = _.find(nodes, n => { return n.nodeType === 'end' })

    if (child.nodeType !== 'condition') connectNodes(child, 'main', endNode, nodes)
    else connectNodes(child, 'yes', endNode, nodes)
  }
  */
}

function severChildConnection (nodeObj, branch, nodes) {
  const childId = _.clone(nodeObj.children[branch])
  const childObj = _.find(nodes, { id: childId })
  _.remove(childObj.parents, { id: nodeObj.id, branch: branch })
  nodeObj.children[branch] = -1
}

function convertToNodeLine (node) {
  let nodeStr = node.id + '=>'
  nodeStr += node.nodeType + ': '
  if (node.type !== 'nopNoModal') {
    if (node.type !== 'nop') nodeStr += node.id + ') \n' + getNodeText(node.type, node)
    if (node.selected) nodeStr += '|selected'
    else if (node.type === 'nop') nodeStr += '|nop'
    nodeStr += ':$nodeClickCallback'
  } else {
    nodeStr += ' |nopNoModal'
  }

  nodeStr += '\n'
  return nodeStr
}

function isAncestorOrSame (origin, node, nodes, visited) {
  if (visited.indexOf(origin) >= 0) return false
  visited.push(origin)

  if (origin === node) return true

  const originNode = _.find(nodes, { id: origin })
  for (const parent of originNode.parents) {
    if (isAncestorOrSame(parent.id, node, nodes, visited)) return true
  }

  return false
}

function convertToConnLine (node, nodes) {
  let connStr = ''
  for (const key in node.children) {
    if (_.isNil(node.children[key]) || node.children[key] < 0) continue
    connStr += node.id
    if (key !== 'main') connStr += '('
    if (key !== 'main') connStr += key
    // if (key === 'no' || isAncestorOrSame(node.id, node.children[key], nodes, [])) connStr += 'right'
    // else connStr += 'bottom'
    if (key !== 'main')  connStr += ')'
    if (node.type === 'nopNoModal') connStr += '(left)'
    connStr += '->'
    connStr += node.children[key]
    connStr += '\n'
  }

  return connStr
}

function convertToDiagramStr (nodes) {
  let nodeStr = ''
  let connStr = ''

  for (const node of nodes) {
    nodeStr += convertToNodeLine(node)
    connStr += convertToConnLine(node, nodes)
  }

  const diagramStr = nodeStr + '\n' + connStr

  return diagramStr
}

function initialize (reactThis) {
  window.nodeClickCallback = (event, node) => {
    reactThis.selectNode(node)
  }
}

function updateNode (data, allNodes) {
  let nodeObj = _.find(allNodes, { id: data.id })

  // Update node contents
  updateNodeContents(nodeObj, data)

  return allNodes
}

function findAllNodesBetween (start, end, nodes, result) {
  if (result.indexOf(start.id) < 0) result.push(start.id)
  else return result

  if (start.id === end.id) return result
  for (const childType of ['main', 'yes', 'no']) {
    if (!_.isNil(start.children[childType]) && start.children[childType] >= 0) {
      const childNode = _.find(nodes, n => { return n.id === start.children[childType] })
      result = findAllNodesBetween(childNode, end, nodes, result)
    }
  }

  return result
}

function deleteNode (data, allNodes) {
  const nodesToDelete = findAllNodesBetween(data.start, data.end, allNodes, [])
  const startParent = _.find(allNodes, n => { return n.id === data.start.parents[0].id })
  const startParentBranch = data.start.parents[0].branch
  const endChild = _.find(allNodes, n => { return n.id === data.end.children.main })
  startParent.children[startParentBranch] = -1
  _.remove(endChild.parents, n => { return n.id === data.end.id })

  _.remove(allNodes, n => { return nodesToDelete.indexOf(n.id) >= 0})

  const subGraph = {
    entry: endChild,
    exit: endChild
  }
  connectGraphs(startParent, startParentBranch, subGraph, allNodes)
}

module.exports = {
  initialize,
  getNewNode,
  connectNodes,
  connectGraphs,
  convertToDiagramStr,
  severChildConnection,
  updateNode,
  deleteNode,
  getNodeHtml
}
