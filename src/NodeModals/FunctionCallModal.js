import React from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import { Trash } from 'react-bootstrap-icons'
import SelectParents from './SelectParents'
import AddChildButtons from './AddChildButtons'

const _ = require('lodash')
const utils = require('../utils')

const baseState = {
  // Parent nodes
  selectedParents: null,
  disabledParents: null,
  currentlySelectedParents: [],

  // Function call
  functionName: '',
  functionParameters: [],
  assignReturnValTo: '',
  okToAddNode: false
}

const defaultValues = {
  int: 0,
  bool: 'true',
  collection: [0],
  variableName: ''
}

const defaultParameterType = 'int'

const inlineDivStyle = {
  display: 'inline-block'
}

class FunctionCallModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = _.cloneDeep(baseState)

    this.resetState = this.resetState.bind(this)
    this.updateFunctionName = this.updateFunctionName.bind(this)
    this.updateAssignReturn = this.updateAssignReturn.bind(this)
    this.addParameter = this.addParameter.bind(this)
    this.updateParameterType = this.updateParameterType.bind(this)
    this.updateParameterValue = this.updateParameterValue.bind(this)
    this.removeParameter = this.removeParameter.bind(this)
    this.validate = this.validate.bind(this)
    this.addNode = this.addNode.bind(this)
    this.updateNode = this.updateNode.bind(this)
    this.selectParents = this.selectParents.bind(this)
  }

  componentDidMount () {
    this.resetState()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.node) {
      // Check if we are adding a child of the same type to a node
      // we are updating
      if (_.isNil(this.props.node)) this.resetState()
    }
  }

  resetState () {
    const newState = _.cloneDeep(baseState)
    // Parent nodes
    utils.assignParentsOnReset(newState, this.props.node, this.props.nodes, this.props.parents)

    // Function call
    if (!_.isNil(this.props.node)) {
      newState.functionName = this.props.node.functionName
      newState.functionParameters = this.props.node.functionParameters
      newState.assignReturnValTo = this.props.node.assignReturnValTo
    }

    this.setState(newState)
  }

  updateFunctionName (ev) {
    const newFunctionName = ev.target.value.trim()

    if (utils.validateVariableOrFunctionName(newFunctionName)) {
      this.setState({
        functionName: newFunctionName
      }, this.validate)
    }
  }

  updateAssignReturn (ev) {
    const newAssignReturnName = ev.target.value.trim()

    if (utils.validateVariableOrFunctionName(newAssignReturnName)) {
      this.setState({
        assignReturnValTo: newAssignReturnName
      }, this.validate)
    }
  }

  addParameter () {
    const newParameter = {
      type: defaultParameterType,
      value: _.cloneDeep(defaultValues[defaultParameterType])
    }

    const currentParameters = this.state.functionParameters
    currentParameters.push(newParameter)

    this.setState({
      functionParameters: currentParameters
    }, this.validate)
  }

  updateParameterType (idx, val) {
    const parameters = this.state.functionParameters
    if (idx >= parameters.length) {
      console.error('Attempting to update type of non existing parameter')
    } else {
      const newParameter = {
        type: val,
        value: _.cloneDeep(defaultValues[val])
      }

      parameters[idx] = newParameter

      this.setState({
        functionParameters: parameters
      }, this.validate)
    }
  }

  updateParameterValue (idx, val) {
    const parameters = this.state.functionParameters
    if (idx >= parameters.length) {
      console.error('Attempting to update value of non existing parameter')
    } else {
      const newParameter = _.cloneDeep(parameters[idx])
      if (newParameter.type === 'int') newParameter.value = parseInt(val)
      else if (newParameter.type === 'bool') newParameter.value = (val === 'true')
      else newParameter.value = val

      parameters[idx] = newParameter

      this.setState({
        functionParameters: parameters
      }, this.validate)
    }
  }

  removeParameter (idx) {
    const parameters = this.state.functionParameters
    parameters.splice(idx, 1)
    this.setState({
      functionParameters: parameters
    }, this.validate)
  }

  validate () {
    let okToAddNode = true
    if (this.state.functionName === '') okToAddNode = false

    this.setState({
      okToAddNode
    })
  }

  addNode () {
    const data = {
      parents: _.clone(this.state.currentlySelectedParents),
      functionName: _.cloneDeep(this.state.functionName),
      functionParameters: _.cloneDeep(this.state.functionParameters),
      assignReturnValTo: _.cloneDeep(this.state.assignReturnValTo)
    }

    this.props.addNewNodeCallback(data)

    this.props.closeCallback()
  }

  updateNode () {
    const data = {
      id: this.props.node.id,
      parents: _.clone(this.state.currentlySelectedParents),
      functionName: _.cloneDeep(this.state.functionName),
      functionParameters: _.cloneDeep(this.state.functionParameters),
      assignReturnValTo: _.cloneDeep(this.state.assignReturnValTo)
    }

    this.props.updateNodeCallback(data, this.props.closeCallback)
  }

  selectParents (selectedParents) {
    this.setState(utils.selectParents(this.props.node, this.props.nodes, selectedParents), this.validate)
  }

  render () {
    return (
      <Modal show={this.props.show} onHide={this.props.closeCallback} size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>
            Aggiungi funzione al programma
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Nome della funzione:</Form.Label>
                <Form.Control value={this.state.functionName} onChange={this.updateFunctionName}/>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          {_.isNil(this.props.node) &&
            <Button variant='success' disabled={!this.state.okToAddNode} onClick={this.addNode}>
              Aggiungi
            </Button>
          }
        </Modal.Footer>
      </Modal>
    )
  }
}

FunctionCallModal.propTypes = {
  show: PropTypes.bool,
  closeCallback: PropTypes.func,
  node: PropTypes.object,
  nodes: PropTypes.array,
  parent: PropTypes.object,
  addChildCallback: PropTypes.func,
  addNewNodeCallback: PropTypes.func,
  updateNodeCallback: PropTypes.func
}

export default FunctionCallModal