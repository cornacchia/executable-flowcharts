const _ = require('lodash')
const mathjs = require('mathjs')
const booleanExpression = require('boolean-expression')

const outputVariableRegex = /\$([a-zA-Z]+[a-zA-Z\d]*)/g

function isNumeric (str) {
  if (typeof str != "string") return false
  return !isNaN(str) &&
         !isNaN(parseFloat(str))
}

function executeFromNode (node, nodes, calcData) {
  if (node.type === 'end') {
    return calcData
  }

  let nextNode = _.find(nodes, { id: node.children.main })

  if (node.type === 'variable') {
    for (const variable of node.variables) {
      calcData.scope[variable.name] = variable.value
    }
  } else if (node.type === 'expression') {
    try {
      mathjs.evaluate(node.expression, calcData.scope)
    } catch (err) {
      // TODO give feedback to user
      console.error(err)
    }
  } else if (node.type === 'condition') {
    var expression = booleanExpression(node.condition)
    var parsedExpr = expression.toString(function (token) {
        // console.log('>>', token)
        if (['<', '>', '==', '(', ')', '+', '-', '/', '*'].indexOf(token) >= 0) return token
        else if (isNumeric(token)) return token
        return 'this[' + JSON.stringify(token) + ']'
    })

    // console.log('eval', parsedExpr)

    const result = function (str) {
      return eval(str)
    }.call(calcData.scope, parsedExpr)

    if (result) nextNode = _.find(nodes, { id: node.children.yes })
    else nextNode = _.find(nodes, { id: node.children.no })
  } else if (node.type === 'output') {
    const matchedVariables = {}
    let match

    do {
      match = outputVariableRegex.exec(node.output)
      if (match) {
          // TODO handle missing variables
          matchedVariables[match[0]] = calcData.scope[match[1]]
      }
    } while (match)

    let outputStr = node.output
    for (const keyVar in matchedVariables) {
      outputStr = outputStr.replaceAll(keyVar, matchedVariables[keyVar])
    }
    calcData.outputs.push(outputStr)
  }

  const memoryStateSnapshot = {
    id: _.clone(node.id),
    memory: _.cloneDeep(calcData.scope)
  }

  calcData.memoryStates.push(memoryStateSnapshot)

  return executeFromNode(nextNode, nodes, calcData)
}

module.exports = {
  executeFromNode
}
