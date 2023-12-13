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

  // Output
  output: '',
  okToAddNode: false
}

class OutputModal extends React.Component {
  constructor (props) {
    super(props)

    this.state = _.cloneDeep(baseState)

    this.resetState = this.resetState.bind(this)
    this.updateOutput = this.updateOutput.bind(this)
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

    let output = ''
    if (!_.isNil(this.props.node)) {
      output = this.props.node.output
    }

    newState.output = output

    this.setState(newState)
  }

  updateOutput (ev) {
    this.setState({
      output: ev.target.value
    }, this.validate)
  }

  validate () {
    let okToGo = true
    // TODO should parse and validate output here probably
    if (this.state.output === '') okToGo = false

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
      output: _.cloneDeep(this.state.output)
    }

    this.props.addNewNodeCallback(data)

    this.props.closeCallback()
  }

  updateNode () {
    const data = {
      id: this.props.node.id,
      parents: _.clone(this.state.currentlySelectedParents),
      output: _.cloneDeep(this.state.output)
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
                Nuovo nodo (output)
              </span>
            }
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <h3>Output:</h3>
            <Col xs={12}>
              <Form.Control onChange={this.updateOutput} value={this.state.output} />
              <Form.Text muted>
                Per stampare il valore di una variabile scrivere il nome della variabile preceduto da <strong>$</strong>, ad esempio: <strong>$n</strong>
              </Form.Text>
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

OutputModal.propTypes = {
  show: PropTypes.bool,
  closeCallback: PropTypes.func,
  node: PropTypes.object,
  nodes: PropTypes.array,
  parent: PropTypes.object,
  addChildCallback: PropTypes.func,
  addNewNodeCallback: PropTypes.func,
  updateNodeCallback: PropTypes.func
}

export default OutputModal
