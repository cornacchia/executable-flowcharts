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

const inputTypeMap = {
  int: 'number',
  str: 'text'
}

const defaultValues = {
  int: 0,
  str: ''
}

const defaultVariableType = 'int'

const baseState = {
    // Parent nodes
    selectedParents: null,
    disabledParents: null,
    currentlySelectedParents: [],

    // Variables
    currentVariableId: -1,
    definedVariables: [],
    selectedVariableType: defaultVariableType,
    currentVariableName: '',
    currentVariableValue: defaultValues[defaultVariableType],
    okToAddNode: false
}

class VariableModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = _.cloneDeep(baseState)

    this.updateCurrentVariableName = this.updateCurrentVariableName.bind(this)
    this.updateCurrentVariableValue = this.updateCurrentVariableValue.bind(this)
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

  resetState () {
    const newState = _.cloneDeep(baseState)
    // Parent nodes
    utils.assignParentsOnReset(newState, this.props.node, this.props.nodes, this.props.parents)

    let definedVariables = []
    if (!_.isNil(this.props.node)) {
      definedVariables = this.props.node.variables
    }

    let currentVariableId = -1
    for (const definedVar of definedVariables) {
      if (definedVar.id > currentVariableId) currentVariableId = definedVar.id
    }

    // Variables
    newState.currentVariableId = currentVariableId
    newState.definedVariables = definedVariables

    this.setState(newState)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.node) {
      // Check if we are adding a child of the same type to a node
      // we are updating
      if (_.isNil(this.props.node)) this.resetState()
    }
  }

  updateCurrentVariableName (ev) {
    // TODO validate name (must start with letter)
    this.setState({
      currentVariableName: ev.target.value
    })
  }

  updateCurrentVariableValue (ev) {
    this.setState({
      currentVariableValue: ev.target.value
    })
  }

  addVariable () {
    const nextId = this.state.currentVariableId + 1
    const newVariable = {
      id: nextId,
      type: this.state.selectedVariableType,
      name: this.state.currentVariableName,
      value: this.state.currentVariableValue
    }

    const stateVariables = this.state.definedVariables
    stateVariables.push(newVariable)

    this.setState({
      currentVariableId: nextId,
      definedVariables: stateVariables,
      selectedVariableType: defaultVariableType,
      currentVariableName: '',
      currentVariableValue: defaultValues[defaultVariableType]
    }, this.validate)
  }

  removeVariable (id) {
    const newVariables = _.filter(this.state.definedVariables, v => { return v.id !== id })
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

    this.props.updateNodeCallback(data)
    this.props.closeCallback()
  }

  render () {
    return (
      <Modal show={this.props.show} onHide={this.props.closeCallback}>
        <Modal.Header closeButton>
          <Modal.Title>
            {!_.isNil(this.props.node) &&
              <span>
                Nodo {this.props.node.id} ({this.props.node.type})
              </span>
            }
            {_.isNil(this.props.node) &&
              <span>
                Nuovo nodo (variable)
              </span>
            }
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <h3>Variabili:</h3>
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
                      <strong>{variable.type}&nbsp;{variable.name}&nbsp;=&nbsp;{variable.value}</strong>
                    </Col>
                  </Row>
                )
              })}
            </Col>
          </Row>

          <hr />

          <Row>
            <h3>Aggiungi variabile</h3>
            <Col xs={12}>
              <Form.Label htmlFor='variableName'>Nome:</Form.Label>
              <Form.Control id='variableName' value={this.state.currentVariableName} onChange={this.updateCurrentVariableName}/>

              <Form.Label htmlFor='variableValue'>Valore:</Form.Label>
              <Form.Control
                type={inputTypeMap[this.state.selectedVariableType]}
                id='variableValue'
                value={this.state.currentVariableValue}
                onChange={this.updateCurrentVariableValue}
              />

              <Button style={{ marginTop: '20px' }} variant='primary' disabled={this.state.currentVariableName === ''} onClick={this.addVariable}>
                + Aggiungi al nodo
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

VariableModal.propTypes = {
  show: PropTypes.bool,
  closeCallback: PropTypes.func,
  node: PropTypes.object,
  nodes: PropTypes.array,
  parent: PropTypes.object,
  addChildCallback: PropTypes.func,
  addNewNodeCallback: PropTypes.func,
  updateNodeCallback: PropTypes.func
}

export default VariableModal
