import React from 'react'
import PropTypes from 'prop-types'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Button from 'react-bootstrap/Button'
import { Clipboard, Calculator, SignpostSplit } from 'react-bootstrap-icons'

class AddChildButtons extends React.Component {
  constructor (props) {
    super(props)

    this.state = {}
  }

  render () {
    return (
      <ButtonGroup>
        <Button variant='dark' onClick={() => {this.props.addChildCallback('variable', this.props.node, this.props.branch)}}>
          + Variabili <Clipboard />
        </Button>
        <Button variant='secondary' onClick={() => {this.props.addChildCallback('expression', this.props.node, this.props.branch)}}>
          + Espressione <Calculator />
        </Button>
        <Button variant='dark' onClick={() => {this.props.addChildCallback('condition', this.props.node, this.props.branch)}}>
          + Condizione <SignpostSplit />
        </Button>
      </ButtonGroup>
    )
  }
}

AddChildButtons.propTypes = {
  addChildCallback: PropTypes.func,
  node: PropTypes.object,
  branch: PropTypes.string
}

export default AddChildButtons
