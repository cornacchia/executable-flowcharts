import React from 'react'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Tabs from 'react-bootstrap/Tabs'
import Tab from 'react-bootstrap/Tab'
import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import { ExclamationTriangle, Play } from 'react-bootstrap-icons'
import FlowChart from 'flowchart.js'
import StartModal from './NodeModals/StartModal'
import VariableModal from './NodeModals/VariableModal'
import ExpressionModal from './NodeModals/ExpressionModal'
import ConditionModal from './NodeModals/ConditionModal'
import OutputModal from './NodeModals/OutputModal'
import FunctionCallModal from './NodeModals/FunctionCallModal'
import AddChildButtons from './NodeModals/AddChildButtons'

const _ = require('lodash')
const nodesUtils = require('./nodes')
const flowOptions = require('./flowOptions')
const executer = require('./executer')
const utils = require('./utils')

class Flow extends React.Component {
  constructor (props) {
    super(props)
    nodesUtils.initialize(this)

    this.state = {
      nodes: { main: [] },
      diagramStr: { main: '' },
      selectedNodeObj: null,
      newNodeType: '',
      newNodeParent: null,
      outputToShow: '',
      memoryStates: [],
      selectedFunc: 'main'
    }

    this.renderDiagram = this.renderDiagram.bind(this)
    this.drawFlowChart = this.drawFlowChart.bind(this)
    this.executeFlowchart = this.executeFlowchart.bind(this)
    this.selectNode = this.selectNode.bind(this)
    this.unselectNode = this.unselectNode.bind(this)
    this.addNode = this.addNode.bind(this)
    this.updateNode = this.updateNode.bind(this)
    this.deleteNode = this.deleteNode.bind(this)
    this.addVariableNode = this.addVariableNode.bind(this)
    this.addExpressionNode = this.addExpressionNode.bind(this)
    this.addConditionNode = this.addConditionNode.bind(this)
    this.addOutputNode = this.addOutputNode.bind(this)
    this.addFunctionCallNode = this.addFunctionCallNode.bind(this)
    this.shouldShowStartModal = this.shouldShowStartModal.bind(this)
    this.shouldShowVariableModal = this.shouldShowVariableModal.bind(this)
    this.shouldShowExpressionModal = this.shouldShowExpressionModal.bind(this)
    this.shouldShowOutputModal = this.shouldShowOutputModal.bind(this)
    this.shouldShowFunctionCallModal = this.shouldShowFunctionCallModal.bind(this)
    this.showExecutionFeedback = this.showExecutionFeedback.bind(this)
    this.setupFunctionBaseNodes = this.setupFunctionBaseNodes.bind(this)
    this.selectFunctionTab = this.selectFunctionTab.bind(this)
  }

  setupFunctionBaseNodes (func) {
    const startNode = nodesUtils.getNewNode('start')
    const endNode = nodesUtils.getNewNode('end')

    const stateNodes = this.state.nodes
    stateNodes[func].push(startNode)
    stateNodes[func].push(endNode)

    nodesUtils.connectNodes(startNode, func, endNode, this.state.nodes.main)
  }

  componentDidMount () {
    this.setupFunctionBaseNodes('main')

    this.renderDiagram()
  }

  selectFunctionTab (tabKey) {
    // TODO render diagram here
    this.setState({
      selectedFunc: tabKey
    })
  }

  executeFlowchart () {
    const startNode = _.find(this.state.nodes.main, { nodeType: 'start' })
    const res = executer.executeFromNode(startNode, this.state.nodes, 'main', executer.getNewCalcData())

    console.log(res.scope, res.outputs)

    this.showExecutionFeedback(res)
  }

  showExecutionFeedback (data) {
    // Handle "console" output
    let fullOutput = ''
    let outputCounter = 0
    for (const output of data.outputs) {
      outputCounter += 1
      fullOutput += '<strong>' + outputCounter + ']</strong> ' + output + '<br />'
    }

    this.setState({ outputToShow: fullOutput, memoryStates: data.memoryStates })
  }

  renderDiagram () {
    const diagramStr = {}
    for (const func in this.state.nodes) {
      const funcStr = nodesUtils.convertToDiagramStr(this.state.nodes[func])
      diagramStr[func] = funcStr
      console.log(func, diagramStr[func])
    }


    this.setState({
      diagramStr
    }, this.drawFlowChart)
  }

  drawFlowChart () {
    // Clear out previous flowcharts
    for (const func in this.state.diagramStr) {
      const flowchartId = 'flowchartDiv' + func
      const flowchartDiv = document.getElementById(flowchartId)
      flowchartDiv.innerHTML = ''

      const diagramStr = this.state.diagramStr[func]
      const diagram = FlowChart.parse(diagramStr)
      diagram.drawSVG(flowchartId, flowOptions)
    }

  }

  selectNode (selectedNode) {
    const nodeId = parseInt(selectedNode.key)
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    const selectedNodeObj = _.find(selectedFuncNodes, { id: nodeId })

    // First unselect other nodes
    for (const func in this.state.nodes) {
      for (const node of this.state.nodes[func]) node.selected = false
    }

    // Then select current node
    if (!_.isNil(selectedNodeObj)) selectedNodeObj.selected = true

    // Handle potential parents
    const selectedNodeParents = []
    if (!_.isNil(selectedNodeObj) && !_.isNil(selectedNodeObj.parents)) {
      for (const parent of selectedNodeObj.parents) {
        const parentNode = _.find(selectedFuncNodes, { id: parent.id })
        const parentBranch = _.find(_.keys(parentNode.children), b => { return parentNode.children[b] === nodeId })
        selectedNodeParents.push({ node: parentNode, branch: parentBranch })
      }
    }

    this.setState({
      newNodeType: '',
      selectedNodeObj: selectedNodeObj,
      selectedNodeParents: selectedNodeParents
    }, this.renderDiagram)
  }

  unselectNode () {
    for (const func in this.state.nodes) {
      for (const node of this.state.nodes[func]) node.selected = false
    }

    this.setState({
      newNodeType: '',
      selectedNodeObj: null
    }, this.renderDiagram)
  }

  addNode (type, parent, branch) {
    this.selectNode(-1)

    this.setState({
      newNodeType: type,
      selectedNodeParents: [{ node: parent, branch: branch }]
    })
  }

  deleteNode (nodeId) {
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    const nodeObj = _.find(selectedFuncNodes, { id: nodeId })
    const parentsObj = _.filter(selectedFuncNodes, n => { return nodeObj.parents.indexOf(n.id) >= 0 })
    const childObj = _.find(selectedFuncNodes, { id: nodeObj.children.main })

    _.remove(selectedFuncNodes, n => { return n.id !== nodeId })

    for (const parentObj of parentsObj) {
      nodesUtils.connectNodes(parentObj, 'main', childObj, selectedFuncNodes)
    }

    return this.renderDiagram()
  }

  updateNode (data, done) {
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    nodesUtils.updateNode(data, selectedFuncNodes)

    return done()
  }

  addVariableNode (data) {
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    const newVariableNode = nodesUtils.getNewNode('variable', data)

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(selectedFuncNodes, { id: parentInfo.id })
      nodesUtils.connectNodes(newNodeParent, parentInfo.branch, newVariableNode, selectedFuncNodes)
    }

    selectedFuncNodes.push(newVariableNode)

    this.renderDiagram()
  }

  addExpressionNode (data) {
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    const newExpressionNode = nodesUtils.getNewNode('expression', data)

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(selectedFuncNodes, { id: parentInfo.id })
      nodesUtils.connectNodes(newNodeParent, parentInfo.branch, newExpressionNode, selectedFuncNodes)
    }

    selectedFuncNodes.push(newExpressionNode)

    this.renderDiagram()
  }

  addConditionNode (data) {
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    const newConditionNode = nodesUtils.getNewNode('condition', data)

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(selectedFuncNodes, { id: parentInfo.id })
      nodesUtils.connectNodes(newNodeParent, parentInfo.branch, newConditionNode, selectedFuncNodes)
    }

    selectedFuncNodes.push(newConditionNode)

    this.renderDiagram()
  }

  addOutputNode (data) {
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    const newOutputNode = nodesUtils.getNewNode('output', data)

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(selectedFuncNodes, { id: parentInfo.id })
      nodesUtils.connectNodes(newNodeParent, parentInfo.branch, newOutputNode, selectedFuncNodes)
    }

    selectedFuncNodes.push(newOutputNode)

    this.renderDiagram()
  }

  addFunctionCallNode (data) {
    const selectedFuncNodes = this.state.nodes[this.state.selectedFunc]
    const newOutputNode = nodesUtils.getNewNode('functionCall', data)

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(selectedFuncNodes, { id: parentInfo.id })
      nodesUtils.connectNodes(newNodeParent, parentInfo.branch, newOutputNode, selectedFuncNodes)
    }

    selectedFuncNodes.push(newOutputNode)

    const functionName = data.functionName
    if (_.isNil(this.state.nodes[functionName])) {
      const nodes = this.state.nodes
      nodes[functionName] = []
      this.setState({
        nodes
      }, () => {
        this.setupFunctionBaseNodes(functionName)
        this.renderDiagram()
      })
    } else {
      this.renderDiagram()
    }
  }

  shouldShowStartModal () {
    return !_.isNil(this.state.selectedNodeObj) &&
      this.state.selectedNodeObj.type === 'start'
  }

  shouldShowVariableModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'variable') ||
    (this.state.newNodeType === 'variable')
  }

  shouldShowExpressionModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'expression') ||
    (this.state.newNodeType === 'expression')
  }

  shouldShowConditionModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'condition') ||
    (this.state.newNodeType === 'condition')
  }

  shouldShowOutputModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'output') ||
    (this.state.newNodeType === 'output')
  }

  shouldShowFunctionCallModal () {
    return (!_.isNil(this.state.selectedNodeObj) &&
    this.state.selectedNodeObj.type === 'functionCall') ||
    (this.state.newNodeType === 'functionCall')
  }

  render () {
    return (
      <div>
        <Row>
          <h3>Aggiungi nodo</h3>
          <AddChildButtons addChildCallback={this.addNode} node={null} branch='main' />
        </Row>
        <hr />
        <Tabs activeKey={this.state.selectedFunc} onSelect={this.selectFunctionTab}>
        {_.keys(this.state.nodes).map((func, idx) => {
          return (
            <Tab eventKey={func} title={func} key={idx}>
              <Row>
                <Col xs={5}>
                  <h3>Diagramma di flusso</h3>
                  <div className='flowChartDiv' id={'flowchartDiv' + func} />
                </Col>

                <Col xs={2}>
                  <h3>Nodi</h3>
                  <ListGroup>
                    {this.state.nodes[func].map((node, idx) => {
                      return (
                        <ListGroup.Item key={idx} onClick={() => { this.selectNode({ key: node.id }) }} active={!_.isNil(this.state.selectedNodeObj) && this.state.selectedNodeObj.id === node.id}>
                          {node.nodeType !== 'start' && node.parents.length === 0 && <ExclamationTriangle />}
                          <strong>{node.id})</strong>
                          <p
                            dangerouslySetInnerHTML={{__html: nodesUtils.getNodeHtml(node.type, node)}}
                          />
                        </ListGroup.Item>
                      )
                    })}
                  </ListGroup>
                </Col>

                <Col xs={5}>
                  <Row>
                    <Col xs={12}>
                      <Button variant='primary' onClick={this.executeFlowchart} style={{ width: '100%' }}>
                        <Play /> Esegui
                      </Button>
                    </Col>
                  </Row>
                  <Row style={{ marginTop: '20px' }}>
                    <h3>Output</h3>
                    <Col xs={12}>
                      <div id='outputDiv' dangerouslySetInnerHTML={{__html: this.state.outputToShow}} style={{ width: '100%', height: '500px', border: '5px solid black' }}>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Tab>
          )
        })}
        </Tabs>
        <hr/>
        <Row>
          {this.state.memoryStates.length > 0 &&
            <h3>Evoluzione della memoria</h3>
          }
          {this.state.memoryStates.map((state, idx) => {
            return (
              <Col className='memoryStateElement' xs={2} key={idx}>
                <strong>Ultimo nodo eseguito:&nbsp;{state.id}</strong>
                <div dangerouslySetInnerHTML={{ __html: utils.translateMemoryStateToHtml(state) }}></div>
              </Col>
            )
          })}
        </Row>

        {this.shouldShowStartModal() &&
          <StartModal
            node={this.state.selectedNodeObj}
            show={this.shouldShowStartModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
          />
        }

        {this.shouldShowVariableModal() &&
          <VariableModal
            node={this.state.selectedNodeObj}
            nodes={this.state.nodes[this.state.selectedFunc]}
            parents={this.state.selectedNodeParents}
            show={this.shouldShowVariableModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addVariableNode}
            updateNodeCallback={this.updateNode}
          />
        }

        {this.shouldShowExpressionModal() &&
          <ExpressionModal
            node={this.state.selectedNodeObj}
            nodes={this.state.nodes[this.state.selectedFunc]}
            parents={this.state.selectedNodeParents}
            show={this.shouldShowExpressionModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addExpressionNode}
            updateNodeCallback={this.updateNode}
          />
        }

        {this.shouldShowConditionModal() &&
          <ConditionModal
            node={this.state.selectedNodeObj}
            nodes={this.state.nodes[this.state.selectedFunc]}
            parents={this.state.selectedNodeParents}
            show={this.shouldShowConditionModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addConditionNode}
            updateNodeCallback={this.updateNode}
          />
        }

        {this.shouldShowOutputModal() &&
          <OutputModal
            node={this.state.selectedNodeObj}
            nodes={this.state.nodes[this.state.selectedFunc]}
            parents={this.state.selectedNodeParents}
            show={this.shouldShowOutputModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addOutputNode}
            updateNodeCallback={this.updateNode}
          />
        }

        {this.shouldShowFunctionCallModal() &&
          <FunctionCallModal
            node={this.state.selectedNodeObj}
            nodes={this.state.nodes[this.state.selectedFunc]}
            parents={this.state.selectedNodeParents}
            show={this.shouldShowFunctionCallModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addFunctionCallNode}
            updateNodeCallback={this.updateNode}
          />
        }

      </div>
    )
  }
}

export default Flow
