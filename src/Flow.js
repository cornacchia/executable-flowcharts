import React from 'react'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import ListGroup from 'react-bootstrap/ListGroup'
import { ExclamationTriangle, Play } from 'react-bootstrap-icons'
import FlowChart from 'flowchart.js'
import StartModal from './NodeModals/StartModal'
import VariableModal from './NodeModals/VariableModal'
import ExpressionModal from './NodeModals/ExpressionModal'
import ConditionModal from './NodeModals/ConditionModal'
import OutputModal from './NodeModals/OutputModal'
import AddChildButtons from './NodeModals/AddChildButtons'

const _ = require('lodash')
const nodes = require('./nodes')
const flowOptions = require('./flowOptions')
const executer = require('./executer')

function checkIfSameParents (oldParents, newParents) {
  if (oldParents.length !== newParents.length) return false
  for (const parent of oldParents) {
    if (_.isNil(_.find(newParents, { id: parent.id }))) return false
  }

  return true
}

class Flow extends React.Component {
  constructor (props) {
    super(props)
    nodes.initialize(this)

    this.state = {
      nodes: [],
      diagramStr: '',
      selectedNodeObj: null,
      newNodeType: '',
      newNodeParent: null,
      outputToShow: ''
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
    this.shouldShowStartModal = this.shouldShowStartModal.bind(this)
    this.shouldShowVariableModal = this.shouldShowVariableModal.bind(this)
    this.shouldShowExpressionModal = this.shouldShowExpressionModal.bind(this)
    this.shouldShowOutputModal = this.shouldShowOutputModal.bind(this)
    this.showExecutionOutputs = this.showExecutionOutputs.bind(this)
  }

  componentDidMount () {
    const startNode = nodes.getNewNode('start')
    const endNode = nodes.getNewNode('end')

    const stateNodes = this.state.nodes
    stateNodes.push(startNode)
    stateNodes.push(endNode)

    nodes.connectNodes(startNode, 'main', endNode, this.state.nodes)

    this.setState({
      nodes: stateNodes
    }, this.renderDiagram)
  }

  executeFlowchart () {
    const startNode = _.find(this.state.nodes, { nodeType: 'start' })
    const res = executer.executeFromNode(startNode, this.state.nodes, { scope: {}, outputs: [] })

    console.log(res.scope, res.outputs)
    this.showExecutionOutputs(res.outputs)
  }

  showExecutionOutputs (outputs) {
    let fullOutput = ''
    let outputCounter = 0
    for (const output of outputs) {
      outputCounter += 1
      fullOutput += '<strong>' + outputCounter + ']</strong> ' + output + '<br />'
    }

    this.setState({ outputToShow: fullOutput })
  }

  renderDiagram () {
    const diagramStr = nodes.convertToDiagramStr(this.state.nodes)
    // console.log(diagramStr)

    this.setState({
      diagramStr: diagramStr
    }, this.drawFlowChart)
  }

  drawFlowChart () {
    // Clear out previous flowchart
    const flowchartDiv = document.getElementById('flowchartDiv')
    flowchartDiv.innerHTML = ''

    const diagramStr = this.state.diagramStr
    const diagram = FlowChart.parse(diagramStr)
    diagram.drawSVG('flowchartDiv', flowOptions)
  }

  selectNode (selectedNode) {
    const nodeId = parseInt(selectedNode.key)
    const selectedNodeObj = _.find(this.state.nodes, { id: nodeId })

    // First unselect other nodes
    const nodes = this.state.nodes
    for (const node of nodes) node.selected = false

    // Then select current node
    if (!_.isNil(selectedNodeObj)) selectedNodeObj.selected = true

    // Handle potential parents
    const selectedNodeParents = []
    if (!_.isNil(selectedNodeObj) && !_.isNil(selectedNodeObj.parents)) {
      for (const parent of selectedNodeObj.parents) {
        const parentNode = _.find(nodes, { id: parent.id })
        const parentBranch = _.find(_.keys(parentNode.children), b => { return parentNode.children[b] === nodeId })
        selectedNodeParents.push({ node: parentNode, branch: parentBranch })
      }
    }

    this.setState({
      nodes,
      newNodeType: '',
      selectedNodeObj: selectedNodeObj,
      selectedNodeParents: selectedNodeParents
    }, this.renderDiagram)
  }

  unselectNode () {
    const nodes = this.state.nodes
    for (const node of nodes) node.selected = false

    this.setState({
      nodes,
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
    const nodeObj = _.find(this.state.nodes, { id: nodeId })
    const parentsObj = _.filter(this.state.nodes, n => { return nodeObj.parents.indexOf(n.id) >= 0 })
    const childObj = _.find(this.state.nodes, { id: nodeObj.children.main })

    const newNodes = _.filter(this.state.nodes, n => { return n.id !== nodeId })

    for (const parentObj of parentsObj) {
      nodes.connectNodes(parentObj, 'main', childObj, newNodes)
    }

    this.setState({
      nodes: newNodes
    }, this.renderDiagram)
  }

  updateNode (data) {
    const nodeObj = _.find(this.state.nodes, { id: data.id })
    console.log('Update node contents')
    nodes.updateNodeContents(nodeObj, data)

    const previousParents = _.filter(this.state.nodes, n => { return !_.isNil(_.find(nodeObj.parents, { id: n.id })) })
    const mainChild = _.find(this.state.nodes, { id: nodeObj.children.main })
    const yesChild = _.find(this.state.nodes, { id: nodeObj.children.yes })
    const noChild = _.find(this.state.nodes, { id: nodeObj.children.no })

    const newParents = _.filter(this.state.nodes, n => { return !_.isNil(_.find(data.parents, { id: n.id })) })

    // If new parents are the same as before -> do nothing
    if (checkIfSameParents(previousParents, newParents)) {
      console.log('Same parents, just re render')
    } else {
      // If either yes or no children exists, we can not know to which parent they
      // should be assigned, so just disconnect them from the diagram for now
      if (!_.isNil(yesChild) || !_.isNil(noChild)) {
        if (!_.isNil(yesChild)) {
          console.log('Yes child, remove')
          nodeObj.children.yes = -1
          _.remove(yesChild.parents, p => { return p === nodeObj.id })
        }
        if (!_.isNil(noChild)) {
          console.log('No child, remove')
          nodeObj.children.no = -1
          _.remove(noChild.parents, p => { return p === nodeObj.id })
        }
      }

      console.log('Remove node from tree and tie up loose strings')
      nodeObj.children.main = -1
      for (const parentObj of previousParents) {
        parentObj.children.main = - 1
        nodes.connectNodes(parentObj, 'main', mainChild, this.state.nodes)
      }

      console.log('Insert node in new place')
      for (const newParentObj of newParents) {
        nodes.connectNodes(newParentObj, 'main', nodeObj, this.state.nodes)
      }

    }

    this.renderDiagram()
  }

  addVariableNode (data) {
    const newVariableNode = nodes.getNewNode('variable', data)

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(this.state.nodes, { id: parentInfo.id })
      nodes.connectNodes(newNodeParent, parentInfo.branch, newVariableNode, this.state.nodes)
    }

    const stateNodes = this.state.nodes
    stateNodes.push(newVariableNode)

    this.setState({
      nodes: stateNodes
    }, this.renderDiagram)
  }

  addExpressionNode (data) {
    const newExpressionNode = nodes.getNewNode('expression', data)

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(this.state.nodes, { id: parentInfo.id })
      nodes.connectNodes(newNodeParent, parentInfo.branch, newExpressionNode, this.state.nodes)
    }

    const stateNodes = this.state.nodes
    stateNodes.push(newExpressionNode)

    this.setState({
      nodes: stateNodes
    }, this.renderDiagram)
  }

  addConditionNode (data) {
    const newConditionNode = nodes.getNewNode('condition', data)

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(this.state.nodes, { id: parentInfo.id })
      nodes.connectNodes(newNodeParent, parentInfo.branch, newConditionNode, this.state.nodes)
    }

    const stateNodes = this.state.nodes
    stateNodes.push(newConditionNode)

    this.setState({
      nodes: stateNodes
    }, this.renderDiagram)
  }

  addOutputNode (data) {
    const newOutputNode = nodes.getNewNode('output', data)

    for (const parentInfo of data.parents) {
      const newNodeParent = _.find(this.state.nodes, { id: parentInfo.id })
      nodes.connectNodes(newNodeParent, parentInfo.branch, newOutputNode, this.state.nodes)
    }

    const stateNodes = this.state.nodes
    stateNodes.push(newOutputNode)

    this.setState({
      nodes: stateNodes
    }, this.renderDiagram)
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

  render () {
    return (
      <div>
        <Row>
          <h3>Aggiungi nodo</h3>
          <AddChildButtons addChildCallback={this.addNode} node={null} branch='main' />
        </Row>
        <hr />
        <Row style={{ height: '300px'}}>
          <Col xs={5}>
            <h3>Diagramma di flusso</h3>
            <div id='flowchartDiv' style={{ height: '100%', overflow: 'scroll' }}></div>
          </Col>

          <Col xs={2}>
            <h3>Nodi</h3>
            <ListGroup>
              {this.state.nodes.map((node, idx) => {
                return (
                  <ListGroup.Item key={idx} onClick={() => { this.selectNode({ key: node.id }) }} active={!_.isNil(this.state.selectedNodeObj) && this.state.selectedNodeObj.id === node.id}>
                    {node.nodeType !== 'start' && node.parents.length === 0 && <ExclamationTriangle />}
                    &nbsp;
                    <strong>{node.id})</strong>
                    <br/>
                    {node.text}
                    <br/>
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
            nodes={this.state.nodes}
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
            nodes={this.state.nodes}
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
            nodes={this.state.nodes}
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
            nodes={this.state.nodes}
            parents={this.state.selectedNodeParents}
            show={this.shouldShowOutputModal()}
            closeCallback={this.unselectNode}
            addChildCallback={this.addNode}
            addNewNodeCallback={this.addOutputNode}
            updateNodeCallback={this.updateNode}
          />
        }

      </div>
    )
  }
}

export default Flow
