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

const defaultVariableValue = 0

const baseState = {
    // Parent nodes
    selectedParents: null,
    disabledParents: null,
    currentlySelectedParents: [],

    // Parameters
    definedVariables: [],
    currentVariableName: '',
    currentVariableValue: _.clone(defaultVariableValue),
    okToAddNode: false
}

class ReadParameterModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = _.cloneDeep(baseState)

    this.updateCurrentVariableName = this.updateCurrentVariableName.bind(this)
    this.updateCurrentVariableValue = this.updateCurrentVariableValue.bind(this)
    this.disableAddVariableButton = this.disableAddVariableButton.bind(this)
    this.addVariable = this.addVariable.bind(this)
    this.removeVariable = this.removeVariable.bind(this)
    this.validate = this.validate.bind(this)
    this.addNode = this.addNode.bind(this)
    this.updateNode = this.updateNode.bind(this)
    this.selectParents = this.selectParents.bind(this)
    this.resetState = this.resetState.bind(this)
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

    // Variables
    let definedVariables = []
    if (!_.isNil(this.props.node)) {
      definedVariables = this.props.node.variables
    }

    // Variables
    newState.definedVariables = definedVariables

    this.setState(newState)
  }

  updateCurrentVariableName (ev) {
    const newVarName = ev.target.value.trim()

    if (utils.validateVariableOrFunctionName(newVarName)) {
      this.setState({
        currentVariableName: ev.target.value
      })
    }
  }

  disableAddVariableButton () {
    if (this.state.currentVariableName === '') return true
    const sameNameVar = _.find(this.state.definedVariables, { name: this.state.currentVariableName })
    if (!_.isNil(sameNameVar)) return true

    return false
  }

  updateCurrentVariableValue (ev) {
    this.setState({
      currentVariableValue: ev.target.value
    })
  }

  addVariable () {
    const newVariable = {
      type: this.state.selectedVariableType,
      name: this.state.currentVariableName,
      value: this.state.currentVariableValue
    }

    const stateVariables = this.state.definedVariables
    stateVariables.push(newVariable)

    this.setState({
      definedVariables: stateVariables,
      currentVariableName: '',
      currentVariableValue: _.clone(defaultVariableValue)
    }, this.validate)
  }

  removeVariable (idx) {
    const newVariables = _.filter(this.state.definedVariables, (v, i) => { return i !== idx })
    this.setState({
      definedVariables: newVariables
    }, this.validate)
  }

  validate () {
    let okToGo = true

    if (this.state.definedVariables.length === 0) okToGo = false
    if (this.state.currentlySelectedParents.length === 0) okToGo = false

    this.setState({
      okToAddNode: okToGo
    })
  }

  selectParents (selectedParents) {
    this.setState(utils.selectParents(this.props.node, this.props.nodes, selectedParents), this.validate)
  }

  addNode () {
    const data = {
      parents: _.clone(this.state.currentlySelectedParents),
      variables: _.cloneDeep(this.state.definedVariables)
    }

    this.props.addNewNodeCallback(data)

    this.props.closeCallback()
  }

  updateNode () {
    const data = {
      id: this.props.node.id,
      parents: _.clone(this.state.currentlySelectedParents),
      variables: _.cloneDeep(this.state.definedVariables)
    }

    this.props.updateNodeCallback(data, this.props.closeCallback)
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
                Nuovo nodo (read parameters)
              </span>
            }
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <h3>Parametri letti:</h3>
            <Col xs={12}>
              {this.state.definedVariables.map((variable, idx) => {
                return (
                  <Row key={idx} style={{ marginTop: '10px' }}>
                    <Col xs={4}>
                      <Button variant='danger' size='sm' onClick={() => {this.removeVariable(variable.id)}} style={{ width: '100%' }}>
                        <Trash />
                      </Button>
                    </Col>
                    <Col xs={8} style={{ textAlign: 'left' }}>
                      <strong>{variable.name}&nbsp;=&nbsp;parametri[{variable.value}]</strong>
                    </Col>
                  </Row>
                )
              })}
            </Col>
          </Row>

          <hr />

          <Row>
            <h3>Leggi parametro in variabile</h3>
            <Col xs={12}>
              <Form.Group>
                <Form.Label htmlFor='variableName'>Nome:</Form.Label>
                <Form.Control id='variableName' value={this.state.currentVariableName} onChange={this.updateCurrentVariableName}/>
                <Form.Text muted>
                  Il nome della variabile deve iniziare con una lettera dell'alfabeto e contenere solo lettere e numeri.
                </Form.Text>
              </Form.Group>
              <Form.Group>
                <Form.Label htmlFor='variableValue'>Parametro:</Form.Label>
                <Form.Control
                  type='number'
                  id='variableValue'
                  value={this.state.currentVariableValue}
                  onChange={this.updateCurrentVariableValue}
                />
              </Form.Group>

              <Button style={{ marginTop: '20px' }} variant='primary' disabled={this.disableAddVariableButton()} onClick={this.addVariable}>
                + Aggiungi parametro al nodo
              </Button>
            </Col>
          </Row>

          <hr />

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

ReadParameterModal.propTypes = {
  show: PropTypes.bool,
  closeCallback: PropTypes.func,
  node: PropTypes.object,
  nodes: PropTypes.array,
  parent: PropTypes.object,
  addChildCallback: PropTypes.func,
  addNewNodeCallback: PropTypes.func,
  updateNodeCallback: PropTypes.func
}

export default ReadParameterModal
