const _ = require('lodash')
const nodes = require('./nodes')
const executer = require('./executer')

function testUpdateNode (startNodes, updates, expectedNodes) {
  let newNodes = []
  for (const update of updates) {
    newNodes = nodes.updateNode(update, _.cloneDeep(startNodes))
  }

  for (const node of newNodes) {
    const expectedNode = _.find(expectedNodes, { id: node.id })
    for (const branch in node.children) {
      if (expectedNode.children[branch] !== node.children[branch]) {
        console.log('[' + node.id + '] Expected child on', branch, ':', expectedNode.children[branch], 'found:', node.children[branch])
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

function testExecuteNodes (nodes, expectedResult) {
  const startNode = _.find(nodes.main, { nodeType: 'start' })
  let error = false
  let errorObj = null
  let res = {}

  try {
    res = executer.executeFromNode(startNode, nodes, 'main', executer.getNewCalcData(nodes))
  } catch (err) {
    error = true
    errorObj = err
  }

  if (expectedResult.error) {
    if (error) return true
    else {
      console.log('!!! Expected error but did not get it')
      return false
    }
  } else if (error) {
    console.log('!!! Execution error', errorObj)
    return false
  }

  for (const func in res.scope) {
    if (_.keys(res.scope[func]).length !== _.keys(expectedResult.scope[func]).length) {
      console.log('!!! Different scope variables(' + func + '), expected: ', JSON.stringify(_.keys(expectedResult.scope[func])), 'found:', _.keys(res.scope[func]))
      return false
    }
  
    for (const key in res.scope[func]) {
      if (_.isNil(expectedResult.scope[func][key])) {
        console.log('!!! Different scope variables(' + func + '), expected: ', JSON.stringify(expectedResult.scope[func]), 'found:', JSON.stringify(res.scope[func]))
        return false
      }
      if (!_.isEqual(res.scope[func][key], expectedResult.scope[func][key])) {
        console.log('!!! Different scope variable values(' + func + '), expected: ', JSON.stringify(expectedResult.scope[func]), 'found:', JSON.stringify(res.scope[func]))
        return false
      }
    }
  }

  return true
}

const TESTS_UPDATE = {
  update1: {
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
  update2: {
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
  update3: {
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
  update4: {
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
  update5: {
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
  },
  update6: {
    log: 'Double conditional update',
    f: testUpdateNode,
    s: [
      { id: 1, nodeType: 'start', children: { main: 2 }, parents: [] },
      { id: 2, nodeType: 'condition', children: { main: -1, yes: 3, no: -1 }, parents: [{ id: 1, branch: 'main' }] },
      { id: 3, nodeType: 'condition', children: { main: -1, yes: 4, no: -1 }, parents: [{ id: 2, branch: 'yes' }] },
      { id: 4, nodeType: 'end', children: { main: -1 }, parents: [{ id: 3, branch: 'yes' }] }
    ],
    u: [
      { id: 2, parents: [{ id: 1, branch: 'main' }, { id: 3, branch: 'no' }] },
    ],
    e: [
      { id: 1, nodeType: 'start', children: { main: 2 }, parents: [] },
      { id: 2, nodeType: 'condition', children: { main: -1, yes: 3, no: -1 }, parents: [{ id: 1, branch: 'main' }, { id: 3, branch: 'no' }] },
      { id: 3, nodeType: 'condition', children: { main: -1, yes: 4, no: 2 }, parents: [{ id: 2, branch: 'yes' }] },
      { id: 4, nodeType: 'end', children: { main: -1 }, parents: [{ id: 3, branch: 'yes' }] }
    ]
  }
}

const TESTS_EXEC = {
  exec1: {
    log: 'Simple variable definition',
    f: testExecuteNodes,
    s: { main: [
        { id: 1, nodeType: 'start', type: 'start', children: { main: 2 }, parents: [] },
        { id: 2, nodeType: 'variable', type: 'variable', children: { main: 3 }, parents: [{ id: 1, branch: 'main' }], variables: [ { name: 'a', value:  1 }, { name: 'b', value: true }, { name: 'c', value: [1, 2, 3] }] },
        { id: 3, nodeType: 'end', type: 'end', children: { main: -1 }, parents: [{ id: 2, branch: 'main' }] }
      ]
    },
    r: {
      error: false,
      scope: {
        main: {
          a: 1,
          b: true,
          c: [1, 2, 3]
        }
      }
    }
  },
  exec2: {
    log: 'Basic expression',
    f: testExecuteNodes,
    s: { main: [
        { id: 1, nodeType: 'start', type: 'start', children: { main: 2 }, parents: [] },
        { id: 2, nodeType: 'variable', type: 'variable', children: { main: 3 }, parents: [{ id: 1, branch: 'main' }], variables: [ { name: 'a', value:  1 } ] },
        { id: 3, nodeType: 'operation', type: 'expression', children: { main: 4 }, parents: [{ id: 2, branch: 'main' }], expressions: ['a = a + 3'] },
        { id: 4, nodeType: 'end', type: 'end', children: { main: -1 }, parents: [{ id: 2, branch: 'main' }] }
      ]
    },
    r: {
      error: false,
      scope: {
        main: {
          a: 4
        }
      }
    }
  },
  exec3: {
    log: 'Expression with parentheses',
    f: testExecuteNodes,
    s: { main: [
        { id: 1, nodeType: 'start', type: 'start', children: { main: 2 }, parents: [] },
        { id: 2, nodeType: 'variable', type: 'variable', children: { main: 3 }, parents: [{ id: 1, branch: 'main' }], variables: [ { name: 'a', value:  1 } ] },
        { id: 3, nodeType: 'operation', type: 'expression', children: { main: 4 }, parents: [{ id: 2, branch: 'main' }], expressions: ['a = (a + 3) * 2'] },
        { id: 4, nodeType: 'end', type: 'end', children: { main: -1 }, parents: [{ id: 2, branch: 'main' }] }
      ]
    },
    r: {
      error: false,
      scope: {
        main: {
          a: 8
        }
      }
    }
  },
  exec4: {
    log: 'Collection access',
    f: testExecuteNodes,
    s: { main: [
        { id: 1, nodeType: 'start', type: 'start', children: { main: 2 }, parents: [] },
        { id: 2, nodeType: 'variable', type: 'variable', children: { main: 3 }, parents: [{ id: 1, branch: 'main' }], variables: [ { name: 'a', value:  [1, 2, 3] } ] },
        { id: 3, nodeType: 'operation', type: 'expression', children: { main: 4 }, parents: [{ id: 2, branch: 'main' }], expressions: ['a[0] = a[1] + a[2]'] },
        { id: 4, nodeType: 'end', type: 'end', children: { main: -1 }, parents: [{ id: 2, branch: 'main' }] }
      ]
    },
    r: {
      error: false,
      scope: {
        main: {
          a: [5, 2, 3]
        }
      }
    }
  },
  exec5: {
    log: 'Find max in collection',
    f: testExecuteNodes,
    s: { main: [
        { id: 1, nodeType: 'start', type: 'start', children: { main: 2 }, parents: [] },
        { id: 2, nodeType: 'variable', type: 'variable', children: { main: 3 }, parents: [{ id: 1, branch: 'main' }], variables: [ { name: 'a', value:  [1, 1, 2, 9, 3] }, { name: 'max', value: -1 }, { name: 'i', value: 0 }, { name: 'len', value: 5 } ] },
        { id: 3, nodeType: 'condition', type: 'condition', children: { main: -1, yes: 4, no: 10 }, parents: [{ id: 2, branch: 'main' }, { id: 6, branch: 'main' }], condition: 'i < len' },
        { id: 4, nodeType: 'condition', type: 'condition', children: { main: -1, yes: 5, no: 6 }, parents: [{ id: 3, branch: 'yes' }], condition: 'max < a[i]' },
        { id: 5, nodeType: 'operation', type: 'expression', children: { main: 6 }, parents: [{ id: 4, branch: 'yes' }], expressions: ['max = a[i]'] },
        { id: 6, nodeType: 'operation', type: 'expression', children: { main: 3 }, parents: [{ id: 4, branch: 'no' }, { id: 5, branch: 'main' }], expressions: ['i = i + 1'] },
        { id: 10, nodeType: 'end', type: 'end', children: { main: -1 }, parents: [{ id: 3, branch: 'no' }] }
      ]
    },
    r: {
      error: false,
      scope: {
        main: {
          a: [1, 1, 2, 9, 3],
          max: 9,
          i: 5,
          len: 5
        }
      }
    }
  }
}

for (const testKey in TESTS_UPDATE) {
  const test = TESTS_UPDATE[testKey]
  const testRes = test.f(test.s, test.u, test.e)
  let str = ''
  if (testRes) str += '[Passed]'
  else str += '[NOT PASSED!!!]'
  str += ' - ' + testKey + ' - '
  str += test.log

  console.log(str)
}

for (const testKey in TESTS_EXEC) {
  const test = TESTS_EXEC[testKey]
  const testRes = test.f(test.s, test.r)
  let str = ''
  if (testRes) str += '[Passed]'
  else str += '[NOT PASSED!!!]'
  str += ' - ' + testKey + ' - '
  str += test.log

  console.log(str)
}