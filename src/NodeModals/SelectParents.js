import React from 'react'
import PropTypes from 'prop-types'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'

const utils = require('../utils')

class SelectParents extends React.Component {
  constructor (props) {
    super(props)

    this.checkParent = this.checkParent.bind(this)
  }

  checkParent (id, checked) {
    const selectedParents = this.props.selectedParents
    selectedParents[id] = checked

    const disabledParents = utils.getDisabledParents(this.props.node, this.props.nodes, selectedParents)

    this.setState({
      disabledParents
    }, () => {this.props.selectCallback(this.props.selectedParents)})
  }

  render () {
    return (
      <div>
        <h3>Nodi precedenti:</h3>
        <Row>
          {utils.getNodeConnections(this.props.nodes).map((conn, idx) => {
            return (
              <Col xs={3} key={idx}>
                <Form.Check name={'check' + conn.value} label={conn.value} checked={this.props.selectedParents[conn.value]} onChange={ ev => { this.checkParent(conn.value, ev.target.checked) }} disabled={!this.props.selectedParents[conn.value] && this.props.disabledParents[conn.value]}/>
              </Col>
            )
          })}
        </Row>
      </div>

    )
  }
}

SelectParents.propTypes = {
  node: PropTypes.object,
  nodes: PropTypes.array,
  selectCallback: PropTypes.func,
  selectedParents: PropTypes.object,
  disabledParents: PropTypes.object
}

export default SelectParents
