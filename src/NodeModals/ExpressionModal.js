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

  // Expression
  currentExpression: '',
  expressions: [],
  okToAddNode: false
}

// TODO allow multiple expressions for node

class ExpressionModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = _.cloneDeep(baseState)

    this.resetState = this.resetState.bind(this)
    this.updateExpression = this.updateExpression.bind(this)
    this.addExpression = this.addExpression.bind(this)
    this.removeExpression = this.removeExpression.bind(this)
    this.validate = this.validate.bind(this)
    this.selectParents = this.selectParents.bind(this)
    this.addNode = this.addNode.bind(this)
    this.updateNode = this.updateNode.bind(this)
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

    let expression = ''
    if (!_.isNil(this.props.node)) {
      expression = this.props.node.expression
    }

    newState.expression = expression

    this.setState(newState)
  }

  updateExpression (ev) {
    this.setState({
      currentExpression: ev.target.value
    }, this.validate)
  }

  addExpression () {
    const currentExpression = this.state.currentExpression
    const expressions = this.state.expressions
    expressions.push(currentExpression)

    this.setState({
      currentExpression: '',
      expressions
    }, this.validate)
  }

  removeExpression (idxToRemove) {
    const expressions = this.state.expressions
    const newExpressions = _.filter(expressions, (v, idx) => { return idx !== idxToRemove})

    this.setState({
      expressions: newExpressions
    }, this.validate)
  }

  validate () {
    let okToGo = true

    // TODO should parse and validate expression here probably

    if (this.state.expressions.length === 0) okToGo = false

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
      expressions: _.cloneDeep(this.state.expressions)
    }

    this.props.addNewNodeCallback(data)

    this.props.closeCallback()
  }

  updateNode () {
    const data = {
      id: this.props.node.id,
      parents: _.clone(this.state.currentlySelectedParents),
      expressions: _.cloneDeep(this.state.expressions)
    }

    this.props.updateNodeCallback(data, this.props.closeCallback)
    // this.props.closeCallback()
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
                Nuovo nodo (expression)
              </span>
            }
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Col xs={12}>
              <h3>Espressioni:</h3>
              {this.state.expressions.map((exp, idx) => {
                return (
                  <Row key={idx}>
                    <Col xs={4}>
                      <Button variant='danger' size='sm' onClick={() => {this.removeExpression(idx)}} style={{ width: '100%' }}>
                        <Trash />
                      </Button>
                    </Col>
                    <Col xs={8}>
                      {exp}
                    </Col>
                  </Row>
                )
              })}
            </Col>
          </Row>

          <Row>
            <h3>Nuova espressione:</h3>
            <Col xs={12}>
              <Form.Control onChange={this.updateExpression} value={this.state.currentExpression} />
            </Col>
          </Row>

          <Row>
            <Col>
              <Button style={{ marginTop: '20px' }} variant='primary' disabled={this.currentExpression === ''} onClick={this.addExpression}>
                + Aggiungi espressione al nodo
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

ExpressionModal.propTypes = {
  show: PropTypes.bool,
  closeCallback: PropTypes.func,
  node: PropTypes.object,
  nodes: PropTypes.array,
  parent: PropTypes.object,
  addChildCallback: PropTypes.func,
  addNewNodeCallback: PropTypes.func,
  updateNodeCallback: PropTypes.func
}

export default ExpressionModal
