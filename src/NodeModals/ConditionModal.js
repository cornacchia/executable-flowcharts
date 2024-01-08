import React from 'react'
import PropTypes from 'prop-types'
import Modal from 'react-bootstrap/Modal'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Button from 'react-bootstrap/Button'
import Form from 'react-bootstrap/Form'
import AddChildButtons from './AddChildButtons'

const _ = require('lodash')
const utils = require('../utils')

const baseState = {
  // Parent nodes
  selectedParents: null,
  disabledParents: null,
  currentlySelectedParents: [],

  // Condition
  condition: '',
  okToAddNode: false
}

class ConditionModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = _.cloneDeep(baseState)

    this.resetState = this.resetState.bind(this)
    this.updateCondition = this.updateCondition.bind(this)
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

    let condition = ''
    if (!_.isNil(this.props.node)) {
      condition = this.props.node.condition
    }

    newState.condition = condition

    this.setState(newState)
  }

  updateCondition (ev) {
    this.setState({
      condition: ev.target.value
    }, this.validate)
  }

  validate () {
    let okToGo = true
    // TODO should parse and validate condition here probably
    if (this.state.condition === '') okToGo = false

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
      condition: _.cloneDeep(this.state.condition)
    }

    this.props.addNewNodeCallback(data)

    this.props.closeCallback()
  }

  updateNode () {
    const data = {
      id: this.props.node.id,
      parents: _.clone(this.state.currentlySelectedParents),
      condition: _.cloneDeep(this.state.condition)
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
                Nuovo nodo (condition)
              </span>
            }
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <h3>Condizione:</h3>
            <Col xs={12}>
              <Form.Control onChange={this.updateCondition} value={this.state.condition} />
            </Col>
          </Row>

        </Modal.Body>

        <Modal.Footer>
          {!_.isNil(this.props.node) &&
            <div>
              <h3>Aggiungi successori (Ramo <strong>Yes</strong>):</h3>
              <AddChildButtons node={this.props.node} addChildCallback={this.props.addChildCallback} branch='yes' />
              <h3>Aggiungi successori (Ramo <strong>No</strong>):</h3>
              <AddChildButtons node={this.props.node} addChildCallback={this.props.addChildCallback} branch='no' />
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

ConditionModal.propTypes = {
  show: PropTypes.bool,
  closeCallback: PropTypes.func,
  node: PropTypes.object,
  nodes: PropTypes.array,
  parent: PropTypes.object,
  addChildCallback: PropTypes.func,
  addNewNodeCallback: PropTypes.func,
  updateNodeCallback: PropTypes.func
}

export default ConditionModal
