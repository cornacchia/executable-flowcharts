const parseExpression = require('./parseExpressions')

function testParseExpression (data) {
  const parsed = parseExpression(data.i)
  if (parsed !== data.o) {
    console.log('!!! result', parsed, 'different from expected', data.o)
    return false
  }

  return true
} 

const TESTS = [
  { i: 'a = 1', o: 'this["a"] = 1' },
  { i: 'a = [1, 2, 3]', o: 'this["a"] = [ 1 , 2 , 3 ]' },
  { i: 'a[0] = 1', o: 'this["a"] [ 0 ] = 1' },
  { i: 'a && b', o: 'this["a"] && this["b"]' },
  { i: 'true && false', o: 'true && false' },
  { i: 'prova', o: 'this["prova"]' },
  { i: 'params[0] + params[1]', o: 'this["params"] [ 0 ] + this["params"] [ 1 ]' },
  { i: '1 === 2', o: '1 === 2' },
  { i: 'res = factorial(params[0] - 1)', o: 'this["res"] = this["factorial"] ( this["params"] [ 0 ] - 1 )' }
]

for (const test of TESTS) {
  let str = ''
  if (testParseExpression(test)) {
    str += 'PASSED'
  } else {
    str += 'NOT PASSED'
  }
  str += '    ' + test.i + ' -> ' + test.o
  console.log(str)
}