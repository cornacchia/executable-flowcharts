const SwapVariables = {"main":[{"type":"start","nodeType":"start","id":1,"parents":[],"children":{"main":3},"selected":false},{"type":"end","nodeType":"end","id":2,"parents":[{"id":6,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"variable","nodeType":"operation","id":3,"parents":[{"id":1,"branch":"main"}],"children":{"main":4},"selected":false,"variables":[{"id":0,"type":"int","name":"value1","value":"1"},{"id":1,"type":"int","name":"value2","value":"5"},{"id":2,"type":"int","name":"tempValue","value":0}]},{"type":"output","nodeType":"inputoutput","id":4,"parents":[{"id":3,"branch":"main"}],"children":{"main":5},"selected":false,"output":"value1 = $value1; value2 = $value2"},{"type":"expression","nodeType":"operation","id":5,"parents":[{"id":4,"branch":"main"}],"children":{"main":6},"selected":false,"expressions":["tempValue = value1","value1 = value2","value2 = tempValue"]},{"type":"output","nodeType":"inputoutput","id":6,"parents":[{"id":5,"branch":"main"}],"children":{"main":2},"selected":false,"output":"value1 = $value1; value2 = $value2"}]}
const Factorial = {"main":[{"type":"start","nodeType":"start","id":1,"parents":[],"children":{"main":9},"selected":false},{"type":"end","nodeType":"end","id":2,"parents":[{"id":10,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"expression","nodeType":"operation","id":9,"parents":[{"id":1,"branch":"main"}],"children":{"main":10},"selected":false,"expressions":["f1 = factorial(4)","f2 = factorial(5)"]},{"type":"output","nodeType":"inputoutput","id":10,"parents":[{"id":9,"branch":"main"}],"children":{"main":2},"selected":false,"output":"f1 = $f1; f2 = $f2"}],"factorial":[{"type":"start","nodeType":"start","id":3,"parents":[],"children":{"main":5},"selected":false},{"type":"end","nodeType":"end","id":4,"parents":[{"id":10001,"branch":"main"}],"children":{"main":-1},"selected":false},{"type":"condition","nodeType":"condition","id":5,"parents":[{"id":3,"branch":"main"}],"children":{"yes":6,"no":7,"main":-1},"selected":false,"condition":"params[0] == 2"},{"type":"nop","nodeType":"operation","id":10001,"nopFor":5,"parents":[{"id":6,"branch":"main"},{"id":8,"branch":"main"}],"children":{"main":4},"selected":false},{"type":"returnValue","nodeType":"operation","id":6,"parents":[{"id":5,"branch":"yes"}],"children":{"main":10001},"selected":false,"returnType":"int","returnValue":2},{"type":"expression","nodeType":"operation","id":7,"parents":[{"id":5,"branch":"no"}],"children":{"main":8},"selected":false,"expressions":["res = params[0] * factorial(params[0] - 1)"]},{"type":"returnValue","nodeType":"operation","id":8,"parents":[{"id":7,"branch":"main"}],"children":{"main":10001},"selected":false,"returnType":"variableName","returnValue":"res"}]}

module.exports = {
  SwapVariables,
  Factorial
}