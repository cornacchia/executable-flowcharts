const _ = require('lodash')
const nodes = require('./nodes')

function testUpdateNode (startNodes, update, expectedNodes) {
  const newNodes = nodes.updateNode(update, _.cloneDeep(startNodes))

  for (const node of newNodes) {
    const expectedNode = _.find(expectedNodes, { id: node.id })
    for (const branch in node.children) {
      if (expectedNode.children[branch] !== node.children[branch]) return false
    }

    for (const parent of node.parents) {
      const relativeParent = _.find(expectedNode.parents, { id: parent.id })
      if (_.isNil(relativeParent)) return false
      if (relativeParent.branch !== parent.branch) return false
    }
  }


  return true
}

const TESTS = {
  test1: {
    log: 'Move node up the graph',
    f: testUpdateNode,
    s: [
      { id: 1, nodeType: 'start', children: { main: 2 }, parents: [] },
      { id: 2, nodeType: 'operation', children: { main: 3 }, parents: [{ id: 1, branch: 'main' }] },
      { id: 3, nodeType: 'operation', children: { main: 4 }, parents: [{ id: 2, branch: 'main' }] },
      { id: 4, nodeType: 'end', children: { main: -1 }, parents: [{ id: 3, branch: 'main' }] }
    ],
    u: { id: 3, parents: [{ id: 1, branch: 'main' }] },
    e: [
      { id: 1, nodeType: 'start', children: { main: 3 }, parents: [] },
      { id: 2, nodeType: 'operation', children: { main: 4 }, parents: [{ id: 3, branch: 'main' }] },
      { id: 3, nodeType: 'operation', children: { main: 2 }, parents: [{ id: 1, branch: 'main' }] },
      { id: 4, nodeType: 'end', children: { main: -1 }, parents: [{ id: 2, branch: 'main' }] }
    ]
  },
  test2: {
    log: 'Move node down the graph',
    f: testUpdateNode,
    s: [
      { id: 1, nodeType: 'start', children: { main: 2 }, parents: [] },
      { id: 2, nodeType: 'operation', children: { main: 3 }, parents: [{ id: 1, branch: 'main' }] },
      { id: 3, nodeType: 'operation', children: { main: 4 }, parents: [{ id: 2, branch: 'main' }] },
      { id: 4, nodeType: 'end', children: { main: -1 }, parents: [{ id: 3, branch: 'main' }] }
    ],
    u: { id: 2, parents: [{ id: 3, branch: 'main' }] },
    e: [
      { id: 1, nodeType: 'start', children: { main: 3 }, parents: [] },
      { id: 2, nodeType: 'operation', children: { main: 4 }, parents: [{ id: 3, branch: 'main' }] },
      { id: 3, nodeType: 'operation', children: { main: 2 }, parents: [{ id: 1, branch: 'main' }] },
      { id: 4, nodeType: 'end', children: { main: -1 }, parents: [{ id: 2, branch: 'main' }] }
    ]
  }
}

for (const testKey in TESTS) {
  const test = TESTS[testKey]
  const testRes = test.f(test.s, test.u, test.e)
  let str = '> ' + testKey + ' - '
  if (testRes) str += ' passed'
  else str += ' NOT PASSED!!!'

  console.log(str)
}