const _ = require('lodash')
const utils = require('./utils')

let ID = 0

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
  output: {
    type: 'output',
    nodeType: 'inputoutput'
  },
  functionCall: {
    type: 'functionCall',
    nodeType: 'subroutine'
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
      newNodeText += variable.type + ' ' + variable.name + ' = ' + utils.getVariableStringRepresentation(variable.type, variable.value)
      if (i < data.variables.length - 1) newNodeText += '\n'
    }
  } else if (type === 'expression') {
    for (const expression of data.expressions) {
      newNodeText += cleanupExpression(expression) + '\n'
    }
  } else if (type === 'condition') {
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
  }

  return newNodeText
}

function getNodeHtml (type, data) {
  const nodeText = getNodeText(type, data)
  const nodeHtml = nodeText.replaceAll('\n', '<br/>')
  return nodeHtml
}

function getNewNode (type, data) {
  if (!NODES[type]) console.error('Not implemented!')

  const newNode = _.cloneDeep(NODES[type])
  newNode.id = ++ID
  newNode.parents = []
  newNode.children = { main: -1 }
  newNode.selected = false

  if (type === 'variable') {
    newNode.variables = _.cloneDeep(data.variables)
  } else if (type === 'expression') {
    newNode.expressions = data.expressions
  } else if (type === 'condition') {
    newNode.condition = data.condition
    newNode.children = { yes: -1, no: -1, main: -1 }
  } else if (type === 'output') {
    newNode.output = data.output
  } else if (type === 'functionCall') {
    newNode.functionName = data.functionName
    newNode.assignReturnValTo = data.assignReturnValTo
    newNode.functionParameters = _.cloneDeep(data.functionParameters)
  }

  return newNode
}

function updateNodeContents (nodeObj, data) {
  if (nodeObj.type === 'variable') {
    nodeObj.variables = _.cloneDeep(data.variables)
  } else if (nodeObj.type === 'expression') {
    nodeObj.expressions = data.expressions
  } else if (nodeObj.type === 'condition') {
    nodeObj.condition = data.condition
  } else if (nodeObj.type === 'output') {
    nodeObj.output = data.output
  } else if (nodeObj.type === 'functionCall') {
    nodeObj.functionName = data.functionName
    nodeObj.assignReturnValTo = data.assignReturnValTo
    nodeObj.functionParameters = _.cloneDeep(data.functionParameters)
  }

  return nodeObj
}

function connectNodes (parent, branch, child, nodes) {
  // console.log('connect', parent.id, child.id, branch)

  // Check if parent and child already connected
  if (parent.children[branch] === child.id) {
    // console.log('!!! Already connected')
    return
  }

  // Check if parent had previous child on the same branch
  let previousChild = null
  if (parent.children[branch] >= 0) previousChild = _.find(nodes, { id: parent.children[branch] })

  // Actually connect parent with new child
  parent.children[branch] = child.id

  // Remove previous parent on the branch, if present
  _.remove(child.parents, { branch: branch })
  // Add new parent
  child.parents.push({ id: parent.id, branch: branch })

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
}

function severChildConnection (nodeObj, branch, nodes) {
  const childId = _.clone(nodeObj.children[branch])
  const childObj = _.find(nodes, { id: childId })
  _.remove(childObj.parents, { id: nodeObj.id, branch: branch })
  nodeObj.children[branch] = -1
}

function convertToNodeLine (node) {
  let nodeStr = node.id + '=>'
  nodeStr += node.nodeType
  nodeStr += ': ' + node.id + ') \n' + getNodeText(node.type, node)
  if (node.selected) nodeStr += '|selected'
  nodeStr += ':$nodeClickCallback'

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
  // If going "forward" direction should be "bottom"
  // if going "backward" direction should be "right"
  let connStr = ''
  for (const key in node.children) {
    if (_.isNil(node.children[key]) || node.children[key] < 0) continue
    connStr += node.id
    connStr += '('
    if (key !== 'main') connStr += key + ','
    if (key === 'no' || isAncestorOrSame(node.id, node.children[key], nodes, [])) connStr += 'right'
    else connStr += 'bottom'
    connStr += ')'
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
  // console.log('Updating node', data.id)
  let nodeObj = _.find(allNodes, { id: data.id })
  // console.log('Update node contents', data.id)
  nodeObj = updateNodeContents(nodeObj, data)

  const previousParentsObjs = _.filter(allNodes, n => { return !_.isNil(_.find(nodeObj.parents, { id: n.id })) })
  const mainChild = _.find(allNodes, { id: nodeObj.children.main })
  const yesChild = _.find(allNodes, { id: nodeObj.children.yes })
  const noChild = _.find(allNodes, { id: nodeObj.children.no })

  const newParents = _.filter(allNodes, n => { return !_.isNil(_.find(data.parents, { id: n.id })) })

  // If new parents are the same as before -> do nothing
  if (utils.checkIfSameParents(previousParentsObjs, newParents)) {
    // console.log('Same parents, just re render')
  } else if (utils.checkIfOnlyAddingParents(previousParentsObjs, newParents)) {
    // console.log('Just adding a new parent to the list')
    for (const parent of data.parents) {
      const newParentObj = _.find(allNodes, n => { return n.id === parent.id })
      // Only connect new parents
      if (_.isNil(_.find(previousParentsObjs, p => { return p.id === newParentObj.id}))) {
        // console.log('>> Add', newParentObj.id, 'as parent to', nodeObj.id)
        connectNodes(newParentObj, parent.branch, nodeObj, allNodes)
      }
    }
  } else {
    // If either yes or no children exists, we can not know to which parent they
    // should be assigned, so just disconnect them from the diagram for now
    if (!_.isNil(yesChild) || !_.isNil(noChild)) {
      if (!_.isNil(yesChild)) {
        // console.log('Yes child, remove')
        nodeObj.children.yes = -1
        _.remove(yesChild.parents, p => { return p === nodeObj.id })
      }
      if (!_.isNil(noChild)) {
        // console.log('No child, remove')
        nodeObj.children.no = -1
        _.remove(noChild.parents, p => { return p === nodeObj.id })
      }
    }

    // console.log('Remove node from tree and tie up loose strings')
    severChildConnection(nodeObj, 'main', allNodes)
    // nodeObj.children.main = -1


    const previousParents = _.cloneDeep(nodeObj.parents)
    for (const parent of previousParents) {
      const parentObj = _.find(previousParentsObjs, { id: parent.id })
      // console.log('Removing from parent', parentObj.id, 'and connecting to', mainChild.id)
      severChildConnection(parentObj, parent.branch, allNodes)
      // parentObj.children.main = - 1

      connectNodes(parentObj, parent.branch, mainChild, allNodes)
    }

    // console.log('Insert node in new place')
    for (const newParent of data.parents) {
      const newParentObj = _.find(newParents, { id: newParent.id })
      connectNodes(newParentObj, newParent.branch, nodeObj, allNodes)
    }
  }

  // console.dir(allNodes, { depth: undefined })
  return allNodes
}

module.exports = {
  initialize,
  getNewNode,
  connectNodes,
  convertToDiagramStr,
  updateNodeContents,
  severChildConnection,
  updateNode,
  getNodeHtml
}
