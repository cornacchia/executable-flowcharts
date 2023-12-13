const _ = require('lodash')

let ID = 0

const NODES = {
  start: {
    type: 'start',
    nodeType: 'start',
    text: 'Start'
  },
  end: {
    type: 'end',
    nodeType: 'end',
    text: 'End'
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
  }
}

function getNewNode (type, data) {
  if (!NODES[type]) console.error('Not implemented!')

  const newNode = _.cloneDeep(NODES[type])
  newNode.id = ++ID
  newNode.parents = []
  newNode.children = { main: -1 }
  newNode.selected = false

  if (type === 'variable') {
    let newNodeText = '\n'
    for (let i = 0; i < data.variables.length; i++) {
      const variable = data.variables[i]
      newNodeText += variable.type + ' ' + variable.name + ' = ' + variable.value
      if (i < data.variables.length - 1) newNodeText += '\n'
    }
    newNode.variables = data.variables
    newNode.text = newNodeText
  } else if (type === 'expression') {
    let newNodeText = '\n'
    newNodeText += data.expression
    newNode.expression = data.expression
    newNode.text = newNodeText
  } else if (type === 'condition') {
    let newNodeText = '\n'
    newNodeText += data.condition
    newNode.condition = data.condition
    newNode.children = { yes: -1, no: -1, main: -1 }
    newNode.text = newNodeText
  }

  return newNode
}

function updateNodeContents (nodeObj, data) {
  if (nodeObj.type === 'variable') {
    let newNodeText = '\n'
    for (let i = 0; i < data.variables.length; i++) {
      const variable = data.variables[i]
      newNodeText += variable.type + ' ' + variable.name + ' = ' + variable.value
      if (i < data.variables.length - 1) newNodeText += '\n'
    }
    nodeObj.variables = data.variables
    nodeObj.text = newNodeText
  } else if (nodeObj.type === 'expression') {
    let newNodeText = '\n'
    newNodeText += data.expression
    nodeObj.expression = data.expression
    nodeObj.text = newNodeText
  } else if (nodeObj.type === 'condition') {
    let newNodeText = '\n'
    newNodeText += data.condition
    nodeObj.condition = data.condition
    nodeObj.children = { yes: -1, no: -1, main: -1 }
    nodeObj.text = newNodeText
  }
}

function connectNodes (parent, branch, child, nodes) {
  // console.log('connect', parent.id, child.id)
  let previousChild = null
  if (parent.children[branch] >= 0) previousChild = _.find(nodes, { id: parent.children[branch] })
  parent.children[branch] = child.id
  child.parents.push({ id: parent.id, branch: branch })

  // TODO handle multiple branches
  if (!_.isNil(previousChild)) {
    if (child.nodeType !== 'condition') connectNodes(child, 'main', previousChild, nodes)
    // else previousChild.parents = _.filter(previousChild.parents, n => { return n.id !== parent.id })
    else connectNodes(child, 'yes', previousChild, nodes)
  } else if (child.nodeType !== 'end' && child.children.main < 0) {
    const endNode = _.find(nodes, n => { return n.nodeType === 'end' })
    if (child.nodeType !== 'condition') connectNodes(child, 'main', endNode, nodes)
    else connectNodes(child, 'yes', endNode, nodes)
  }
}

function convertToNodeLine (node) {
  let nodeStr = node.id + '=>'
  nodeStr += node.nodeType
  nodeStr += ': ' + node.id + ') ' + node.text
  if (node.selected) nodeStr += '|selected'
  nodeStr += ':$nodeClickCallback'

  nodeStr += '\n'
  return nodeStr
}

function convertToConnLine (node) {
  let connStr = ''
  for (const key in node.children) {
    if (_.isNil(node.children[key]) || node.children[key] < 0) continue
    connStr += node.id
    if (key !== 'main') connStr += '(' + key + ')'
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
    connStr += convertToConnLine(node)
  }

  const diagramStr = nodeStr + '\n' + connStr

  return diagramStr
}

function initialize (reactThis) {
  window.nodeClickCallback = (event, node) => {
    reactThis.selectNode(node)
  }
}

module.exports = {
  initialize,
  getNewNode,
  connectNodes,
  convertToDiagramStr,
  updateNodeContents
}
