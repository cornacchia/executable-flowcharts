// Based on https://github.com/marcbachmann/boolean-expression
const _ = require('lodash')

var allOperators = /(true|false|!|&&|\|\||\(|\)|\[|\]|===|=|,|\s)/g
const accessArrayRegex = /^([a-zA-Z][a-zA-Z\d]*)\[([a-zA-Z\d]{0,})\]$/

function isNumeric (str) {
  if (typeof str != "string") return false
  return !isNaN(str) &&
         !isNaN(parseFloat(str))
}

function cleanupUserInput (token) {
  if (['<', '>', '==', '(', ')', '+', '-', '/', '*', '=', '+=', '-=', '[', ']', ',', 'true', 'false'].indexOf(token) >= 0) return token
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

function Expression (str) {
  this._parsed = str.split(allOperators).reduce(rewrite, [])
}

Expression.prototype.toString = function toString (map) {
  return this._parsed.map(function (t, i, exp) {
    if (t.type === 'operator') return t.value
    return (map || expressionToString)(t.value, i)
  }).join(' ')
}

Expression.prototype.toTokens = function toTokens () {
  return this._parsed
  .map(function (e) { return e.type === 'token' ? e.value : undefined })
}

var nativeOperators = /^(true|false|!|&&|\|\||\(|\)|\[|\]|===|=|,|\s)$/
function rewrite (ex, el, i, all) {
  var t = el.trim()
  if (!t) return ex
  if (nativeOperators.test(t)) ex.push({type: 'operator', value: t})
  else ex.push({type: 'token', value: t.replace(/['\\]/g, '\\$&')})
  return ex
}

function expressionToString (token) {
  return token
}

function parseExpression (expr) {
  const parsedExpression = new Expression(expr)
  const strRes = parsedExpression.toString(_.bind(cleanupUserInput))
  return strRes
}

module.exports = parseExpression
