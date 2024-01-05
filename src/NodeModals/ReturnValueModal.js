import React from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import SelectParents from './SelectParents'
import AddChildButtons from './AddChildButtons'

const _ = require('lodash')
const utils = require('../utils')

const defaultReturnValueType = 'int'
const defaultValues = {
  int: 0,
  bool: 'true',
  collection: [0],
  variableName: ''
}

const baseState = {
  // Parent nodes
  selectedParents: null,
  disabledParents: null,
  currentlySelectedParents: [],

  // Return value
  returnType: _.clone(defaultReturnValueType),
  returnValue: _.cloneDeep(defaultValues[defaultReturnValueType]),
  okToAddNode: false
}

class ReturnValueModal extends React.Component {
  constructor (props) {
    super(props)
    this.state = _.cloneDeep(baseState)

    this.resetState = this.resetState.bind(this)
    this.updateReturnType = this.updateReturnType.bind(this)
    this.updateReturnValue = this.updateReturnValue.bind(this)
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
      newState.returnType = _.cloneDeep(this.props.node.returnType)
      newState.returnValue = _.cloneDeep(this.props.node.returnValue)
    }

    this.setState(newState, this.validate)
  }

  updateReturnType (ev) {
    const newType = ev.target.value
    this.setState({
      returnType: newType,
      returnValue: _.cloneDeep(defaultValues[newType])
    }, this.validate)
  }

  updateReturnValue (ev) {
    let newValue = ev.target.value

    if (this.state.returnType === 'int') newValue = parseInt(newValue)
    else if (this.state.returnType === 'bool') newValue = (newValue === 'true')

    this.setState({
      returnValue: newValue
    }, this.validate)

  }

  validate () {
    let okToAddNode = true
    if (_.isNil(this.state.returnValue)) okToAddNode = false
    if (this.state.currentlySelectedParents.length === 0) okToAddNode = false

    this.setState({
      okToAddNode
    })
  }

  addNode () {
    const data = {
      parents: _.cloneDeep(this.state.currentlySelectedParents),
      returnType: _.cloneDeep(this.state.returnType),
      returnValue: _.cloneDeep(this.state.returnValue)
    }

    this.props.addNewNodeCallback(data)

    this.props.closeCallback()
  }

  updateNode () {
    const data = {
      id: this.props.node.id,
      parents: _.cloneDeep(this.state.currentlySelectedParents),
      returnType: _.cloneDeep(this.state.returnType),
      returnValue: _.cloneDeep(this.state.returnValue)
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
                Nuovo nodo (return value)
              </span>
            }
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Valore da ritornare:</Form.Label>
                <Row>
                  <Col xs={4}>
                  <Form.Select value={this.state.returnType} onChange={this.updateReturnType}>
                    <option value='int'>Numero intero</option>
                    <option value='bool'>Booleano</option>
                    <option value='variableName'>Variabile</option>
                  </Form.Select>
                  </Col>
                  <Col xs={8}>
                    {this.state.returnType === 'int' &&
                      <Form.Control
                        type='number'
                        value={this.state.returnValue}
                        onChange={this.updateReturnValue}
                      />
                    }
                    {this.state.returnType === 'bool' &&
                      <Form.Select value={this.state.returnValue} onChange={this.updateReturnValue}>
                        <option value='true'>true</option>
                        <option value='false'>false</option>
                      </Form.Select>
                    }
                    {this.state.returnType === 'variableName' &&
                      <Form.Control
                        value={this.state.returnValue}
                        onChange={this.updateReturnValue}
                      />
                    }
                  </Col>
                </Row>
              </Form.Group>
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

ReturnValueModal.propTypes = {
  show: PropTypes.bool,
  closeCallback: PropTypes.func,
  node: PropTypes.object,
  nodes: PropTypes.array,
  parent: PropTypes.object,
  addChildCallback: PropTypes.func,
  addNewNodeCallback: PropTypes.func,
  updateNodeCallback: PropTypes.func
}

export default ReturnValueModal
