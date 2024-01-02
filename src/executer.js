const _ = require('lodash')
const booleanExpression = require('boolean-expression')

const accessArrayRegex = /^([a-zA-Z][a-zA-Z\d]*)\[([a-zA-Z\d]{0,})\]$/
const outputVariableRegex = /\$([a-zA-Z]+[a-zA-Z\d]*)/g

function getNewCalcData (nodes) {
  const calcData = { scope: {}, outputs: [], memoryStates: [], parameters: {}, returnVal: {} }
  for (const func in nodes) {
    calcData.scope[func] = {}
    calcData.parameters[func] = {}
    calcData.returnVal[func] = null
  }

  return calcData
}

function isNumeric (str) {
  if (typeof str != "string") return false
  return !isNaN(str) &&
         !isNaN(parseFloat(str))
}

function cleanupUserInput (token) {
  if (['<', '>', '==', '(', ')', '+', '-', '/', '*', '=', '+=', '-='].indexOf(token) >= 0) return token
  else if (isNumeric(token)) return token
  else if (accessArrayRegex.test(token)) {
    const match = accessArrayRegex.exec(token)
    const varName = match[1]
    const arrayAccess = match[2]
    let arrayAccessStr = '[' + arrayAccess + ']'
    if (!isNumeric(arrayAccess)) arrayAccessStr = '[this[' + JSON.stringify(arrayAccess) + ']]'
    return 'this[' + JSON.stringify(varName) + ']' + arrayAccessStr
  }

  return 'this[' + JSON.stringify(token) + ']'
}

function executeFromNode (node, nodes, func, calcData) {
  if (node.type === 'end') {
    return calcData
  }

  let nextNode = _.find(nodes[func], { id: node.children.main })

  if (node.type === 'variable') {
    for (const variable of node.variables) {
      calcData.scope[func][variable.name] = variable.value
    }
  } else if (node.type === 'expression') {
    for (const expr of node.expressions) {
      const expression = booleanExpression(expr)
      const parsedExpr = expression.toString(cleanupUserInput)

      const result = function (str) {
        return eval(str)
      }.call(calcData.scope[func], parsedExpr)
    }

  } else if (node.type === 'condition') {
    const condition = booleanExpression(node.condition)
    const parsedCondition = condition.toString(cleanupUserInput)

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
  } else if (node.type === 'functionCall') {
    const functionName = node.functionName
    const assignReturnValTo = node.assignReturnValTo
    const parameters = node.functionParameters

    if (parameters.length > 0) {
      const newParameters = []
      for (const parameter of parameters) {
        newParameters.push(parameter.value)
      }
      calcData.parameters[functionName] = newParameters
    }

    const funcStartNode = _.find(nodes[functionName], n => { return n.type === 'start' })
    // TODO pass parameters
    executeFromNode(funcStartNode, nodes, functionName, calcData)

    if (assignReturnValTo !== '') {
      // TODO handle missing variable
      calcData.scope[func][assignReturnValTo] = calcData.returnVal[functionName]
    }

    if (!_.isNil(calcData.returnVal[functionName])) {
      // "Consume" the return value
      calcData.returnVal[functionName] = null
      // Delete parameters
      calcData.parameters[functionName] = []
    }
  } else if (node.type === 'returnValue') {
    const returnType = node.returnType
    let returnValue = node.returnValue
    if (returnType === 'variableName') {
      // TODO handle missing variable
      returnValue = _.cloneDeep(calcData.scope[func][returnValue])
    }
    calcData.returnVal[func] = returnValue
  } else if (node.type === 'readParameters') {
    for (const variable of node.variables) {
      // TODO handle missing parameter
      calcData.scope[func][variable.name] = calcData.parameters[func][variable.value]
    }
  }

  const memoryStateSnapshot = {
    id: _.clone(node.id),
    func: func,
    memory: _.cloneDeep(calcData.scope)
  }

  calcData.memoryStates.push(memoryStateSnapshot)

  return executeFromNode(nextNode, nodes, func, calcData)
}

module.exports = {
  getNewCalcData,
  executeFromNode
}
