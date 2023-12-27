const _ = require('lodash')
const nodes = require('./nodes')

function testUpdateNode (startNodes, updates, expectedNodes) {
  let newNodes = []
  for (const update of updates) {
    newNodes = nodes.updateNode(update, _.cloneDeep(startNodes))
  }

  for (const node of newNodes) {
    const expectedNode = _.find(expectedNodes, { id: node.id })
    for (const branch in node.children) {
      if (expectedNode.children[branch] !== node.children[branch]) {
        console.log('[' + node.id + '] Expected child:', expectedNode.children[branch], 'found:', node.children[branch])
        return false
      }
    }

    if (node.parents.length !== expectedNode.parents.length) {
      console.log('[' + node.id + '] Unexpected number of parents')
      return false
    }

    for (const parent of node.parents) {
      const relativeParent = _.find(expectedNode.parents, { id: parent.id })
      if (_.isNil(relativeParent)) {
        console.log('[' + node.id + '] Unexpected parent:', parent.id)
        return false
      }
      if (relativeParent.branch !== parent.branch) {
        console.log('[' + node.id + '] Parent:', parent.id, 'expected:', parent.branch, 'found:', relativeParent.branch)
        return false
      }
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
    u: [{ id: 3, parents: [{ id: 1, branch: 'main' }] }],
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
    u: [{ id: 2, parents: [{ id: 3, branch: 'main' }] }],
    e: [
      { id: 1, nodeType: 'start', children: { main: 3 }, parents: [] },
      { id: 2, nodeType: 'operation', children: { main: 4 }, parents: [{ id: 3, branch: 'main' }] },
      { id: 3, nodeType: 'operation', children: { main: 2 }, parents: [{ id: 1, branch: 'main' }] },
      { id: 4, nodeType: 'end', children: { main: -1 }, parents: [{ id: 2, branch: 'main' }] }
    ]
  },
  test3: {
    log: 'Move node down the graph, then up again',
    f: testUpdateNode,
    s: [
      { id: 1, nodeType: 'start', children: { main: 2 }, parents: [] },
      { id: 2, nodeType: 'operation', children: { main: 3 }, parents: [{ id: 1, branch: 'main' }] },
      { id: 3, nodeType: 'operation', children: { main: 4 }, parents: [{ id: 2, branch: 'main' }] },
      { id: 4, nodeType: 'end', children: { main: -1 }, parents: [{ id: 3, branch: 'main' }] }
    ],
    u: [
      { id: 2, parents: [{ id: 3, branch: 'main' }] },
      { id: 2, parents: [{ id: 1, branch: 'main' }] }
    ],
    e: [
      { id: 1, nodeType: 'start', children: { main: 2 }, parents: [] },
      { id: 2, nodeType: 'operation', children: { main: 3 }, parents: [{ id: 1, branch: 'main' }] },
      { id: 3, nodeType: 'operation', children: { main: 4 }, parents: [{ id: 2, branch: 'main' }] },
      { id: 4, nodeType: 'end', children: { main: -1 }, parents: [{ id: 3, branch: 'main' }] }
    ]
  },
  test4: {
    log: 'Move node out of "no" branch',
    f: testUpdateNode,
    s: [
      { id: 1, nodeType: 'start', children: { main: 2 }, parents: [] },
      { id: 2, nodeType: 'operation', children: { main: 3 }, parents: [{ id: 1, branch: 'main' }] },
      { id: 3, nodeType: 'condition', children: { main: -1, yes: 5, no: 6 }, parents: [{ id: 2, branch: 'main' }] },
      { id: 5, nodeType: 'operation', children: { main: 7 }, parents: [{ id: 3, branch: 'yes' }] },
      { id: 6, nodeType: 'operation', children: { main: 7 }, parents: [{ id: 3, branch: 'no' }] },
      { id: 7, nodeType: 'end', children: { main: -1 }, parents: [{ id: 5, branch: 'main' }, { id: 6, branch: 'main' }] }
    ],
    u: [
      { id: 6, parents: [{ id: 1, branch: 'main' }] },
    ],
    e: [
      { id: 1, nodeType: 'start', children: { main: 6 }, parents: [] },
      { id: 2, nodeType: 'operation', children: { main: 3 }, parents: [{ id: 6, branch: 'main' }] },
      { id: 3, nodeType: 'condition', children: { main: -1, yes: 5, no: 7 }, parents: [{ id: 2, branch: 'main' }] },
      { id: 5, nodeType: 'operation', children: { main: 7 }, parents: [{ id: 3, branch: 'yes' }] },
      { id: 6, nodeType: 'operation', children: { main: 2 }, parents: [{ id: 1, branch: 'main' }] },
      { id: 7, nodeType: 'end', children: { main: -1 }, parents: [{ id: 5, branch: 'main' }, { id: 3, branch: 'no' }] }
    ]
  },
  test5: {
    log: 'Move node out of "yes" branch',
    f: testUpdateNode,
    s: [
      { id: 1, nodeType: 'start', children: { main: 2 }, parents: [] },
      { id: 2, nodeType: 'operation', children: { main: 3 }, parents: [{ id: 1, branch: 'main' }] },
      { id: 3, nodeType: 'condition', children: { main: -1, yes: 5, no: 6 }, parents: [{ id: 2, branch: 'main' }] },
      { id: 5, nodeType: 'operation', children: { main: 7 }, parents: [{ id: 3, branch: 'yes' }] },
      { id: 6, nodeType: 'operation', children: { main: 7 }, parents: [{ id: 3, branch: 'no' }] },
      { id: 7, nodeType: 'end', children: { main: -1 }, parents: [{ id: 5, branch: 'main' }, { id: 6, branch: 'main' }] }
    ],
    u: [
      { id: 5, parents: [{ id: 1, branch: 'main' }] },
    ],
    e: [
      { id: 1, nodeType: 'start', children: { main: 5 }, parents: [] },
      { id: 2, nodeType: 'operation', children: { main: 3 }, parents: [{ id: 5, branch: 'main' }] },
      { id: 3, nodeType: 'condition', children: { main: -1, yes: 7, no: 6 }, parents: [{ id: 2, branch: 'main' }] },
      { id: 5, nodeType: 'operation', children: { main: 2 }, parents: [{ id: 1, branch: 'main' }] },
      { id: 6, nodeType: 'operation', children: { main: 7 }, parents: [{ id: 3, branch: 'no' }] },
      { id: 7, nodeType: 'end', children: { main: -1 }, parents: [{ id: 3, branch: 'yes' }, { id: 6, branch: 'main' }] }
    ]
  }
}

for (const testKey in TESTS) {
  const test = TESTS[testKey]
  const testRes = test.f(test.s, test.u, test.e)
  let str = ''
  if (testRes) str += '[Passed]'
  else str += '[NOT PASSED!!!]'
  str += ' - ' + testKey + ' - '
  str += test.log

  console.log(str)
}