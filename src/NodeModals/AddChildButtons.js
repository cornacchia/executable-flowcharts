import React from 'react'
import PropTypes from 'prop-types'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Button from 'react-bootstrap/Button'
import { Calculator, SignpostSplit, Printer, ArrowRepeat, BoxArrowUp } from 'react-bootstrap-icons'

class AddChildButtons extends React.Component {
  constructor (props) {
    super(props)

    this.state = {}
  }

  render () {
    return (
      <ButtonGroup>
        <Button variant='dark' onClick={() => {this.props.addChildCallback('expression', this.props.node, this.props.branch)}}>
          Espressione <Calculator />
        </Button>
        <Button variant='secondary' onClick={() => {this.props.addChildCallback('condition', this.props.node, this.props.branch)}}>
          Condizione <SignpostSplit />
        </Button>
        <Button variant='dark' onClick={() => {this.props.addChildCallback('loop', this.props.node, this.props.branch)}}>
          Ciclo <ArrowRepeat />
        </Button>
        <Button variant='secondary' onClick={() => {this.props.addChildCallback('output', this.props.node, this.props.branch)}}>
          Output <Printer />
        </Button>
        <Button variant='dark' onClick={() => {this.props.addChildCallback('returnValue', this.props.node, this.props.branch)}}>
          Ritorna valore <BoxArrowUp />
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
