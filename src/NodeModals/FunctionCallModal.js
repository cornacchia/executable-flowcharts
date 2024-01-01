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
        value: _.cloneDeep(defaultValues)
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
    if (this.state.currentlySelectedParents.length === 0) okToAddNode = false

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
            {!_.isNil(this.props.node) &&
              <span>
                Nodo {this.props.node.id} ({this.props.node.type})
              </span>
            }
            {_.isNil(this.props.node) &&
              <span>
                Nuovo nodo (function call)
              </span>
            }
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col>
              {this.state.assignReturnValTo &&
                <div style={inlineDivStyle}>{this.state.assignReturnValTo}&nbsp;=&nbsp;</div>
              }
              {this.state.functionName &&
                <div style={inlineDivStyle}>{this.state.functionName}(</div>
              }
              {this.state.functionParameters.map((par, idx) => {
                return (
                  <div style={inlineDivStyle} key={idx}>{par.value}{idx < this.state.functionParameters.length - 1 && ','}</div>
                )
              })}
              {this.state.functionName &&
                <div style={inlineDivStyle}>)</div>
              }
            </Col>
          </Row>
          <hr />
          <Row>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Nome della funzione:</Form.Label>
                <Form.Control value={this.state.functionName} onChange={this.updateFunctionName}/>
              </Form.Group>
              <Form.Group>
                <Form.Label>Assegna risultato a variabile:</Form.Label>
                <Form.Control value={this.state.assignReturnValTo} onChange={this.updateAssignReturn} />
              </Form.Group>
              <Form.Group style={{ marginTop: '10px' }}>
                <Button variant='primary' onClick={this.addParameter}>
                  Aggiungi parametro
                </Button>
              </Form.Group>
              <hr />
              {this.state.functionParameters.map((par, idx) => {
                return (
                  <Form.Group key={idx}>
                    <Form.Label>Parametro {idx}:</Form.Label>
                    <Row>
                      <Col xs={5}>
                        <Form.Select value={par.type} onChange={ev => { this.updateParameterType(idx, ev.target.value)}}>
                          <option value='int'>Numero intero</option>
                          <option value='bool'>Booleano</option>
                          <option value='variableName'>Variabile</option>
                        </Form.Select>
                      </Col>
                      <Col xs={5}>
                        {par.type === 'int' &&
                          <Form.Control
                            type='number'
                            value={par.value}
                            onChange={ev => { this.updateParameterValue(idx, ev.target.value)}}
                          />
                        }
                        {par.type === 'bool' &&
                          <Form.Select value={par.value} onChange={ev => { this.updateParameterValue(idx, ev.target.value ) }}>
                            <option value='true'>true</option>
                            <option value='false'>false</option>
                          </Form.Select>
                        }
                        {par.type === 'variableName' &&
                          <Form.Control
                            value={par.value}
                            onChange={ev => { this.updateParameterValue(idx, ev.target.value)}}
                          />
                        }
                      </Col>
                      <Col xs={2}>
                        <Button variant='danger' onClick={() => { this.removeParameter(idx) }}>
                          <Trash />
                        </Button>
                      </Col>
                    </Row>
                  </Form.Group>
                )
              })}
            </Col>
          </Row>
          <Row>
            <Col xs={12}>
              {!_.isNil(this.state.selectedParents) &&
                <SelectParents node={this.props.node} nodes={this.props.nodes} selectedParents={this.state.selectedParents} disabledParents={this.state.disabledParents} selectCallback={this.selectParents}/>
              }
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          {!_.isNil(this.props.node) &&
            <div>
              <h3>Aggiungi successori:</h3>
              <AddChildButtons node={this.props.node} addChildCallback={this.props.addChildCallback} branch='main' />
            </div>
          }

          {!_.isNil(this.props.node) &&
            <Button variant='success' disabled={!this.state.okToAddNode} onClick={this.updateNode}>
              Aggiorna nodo
            </Button>
          }

          {_.isNil(this.props.node) &&
            <Button variant='success' disabled={!this.state.okToAddNode} onClick={this.addNode}>
              Aggiungi nodo
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