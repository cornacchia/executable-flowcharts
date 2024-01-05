const _ = require('lodash')
const parseExpressions = require('./parseExpressions')

const outputVariableRegex = /\$([a-zA-Z]+[a-zA-Z\d]*)/g

function getNewCalcData (nodes) {
  const calcData = { scope: {}, outputs: [], memoryStates: [], returnVal: {} }
  for (const func in nodes) {
    calcData.scope[func] = {}
    for (const otherFunc in nodes) {
      // TODO should differentiate the scopes of recursive function calls
      if (otherFunc === 'main') continue
      calcData.scope[func][otherFunc] = (...args) => {
        calcData.scope[otherFunc].params = _.cloneDeep(args)
        const funcStartNode = _.find(nodes[otherFunc], n => { return n.type === 'start' })
        executeFromNode(funcStartNode, nodes, otherFunc, calcData)
        const res = _.cloneDeep(calcData.returnVal[otherFunc])

        // "Consume" the return value
        calcData.returnVal[otherFunc] = null

        // Delete parameters
        // calcData.scope[otherFunc] = []
        return res
      }
    }
    calcData.returnVal[func] = null
  }

  return calcData
}
function executeFromNode (node, nodes, func, calcData) {
  let nextNode
  if (node.type !== 'end') {
    nextNode = _.find(nodes[func], { id: node.children.main })
  }

  if (node.type === 'variable') {
    for (const variable of node.variables) {
      calcData.scope[func][variable.name] = variable.value
    }
  } else if (node.type === 'expression') {
    for (const expr of node.expressions) {
      const parsedExpr = parseExpressions(expr)
      // console.log('expr', parsedExpr)

      const result = function (str) {
        return eval(str)
      }.call(calcData.scope[func], parsedExpr)
    }

  } else if (node.type === 'condition' || node.type === 'loop') {
    // const condition = booleanExpression(node.condition)
    // const parsedCondition = condition.toString(cleanupUserInput)
    const parsedCondition = parseExpressions(node.condition)
    // console.log('cond', parsedCondition)

    const result = function (str) {
      return eval(str)
    }.call(calcData.scope[func], parsedCondition)

    if (result) nextNode = _.find(nodes[func], { id: node.children.yes })
    else nextNode = _.find(nodes[func], { id: node.children.no })
  } else if (node.type === 'output') {
    const matchedVariables = {}
    let match

    do {
      match = outputVariableRegex.exec(node.output)
      if (match) {
          // TODO handle missing variables
          matchedVariables[match[0]] = calcData.scope[func][match[1]]
      }
    } while (match)

    let outputStr = node.output
    for (const keyVar in matchedVariables) {
      outputStr = outputStr.replaceAll(keyVar, matchedVariables[keyVar])
    }
    calcData.outputs.push({ func, str: outputStr })
  } else if (node.type === 'returnValue') {
    const returnType = node.returnType
    let returnValue = node.returnValue
    if (returnType === 'variableName') {
      // TODO handle missing variable
      returnValue = _.cloneDeep(calcData.scope[func][returnValue])
    }
    calcData.returnVal[func] = returnValue
    // console.log('set return value to', calcData.returnVal[func], JSON.stringify(calcData.scope[func]))
  }

  if (node.type !== 'nop') {
    const memoryStateSnapshot = {
      id: _.clone(node.id),
      type: _.clone(node.type),
      func: func,
      memory: _.cloneDeep(calcData.scope)
    }
  
    calcData.memoryStates.push(memoryStateSnapshot)
  }

  if (node.type === 'end') {
    return calcData
  } else return executeFromNode(nextNode, nodes, func, calcData)
}

module.exports = {
  getNewCalcData,
  executeFromNode
}
