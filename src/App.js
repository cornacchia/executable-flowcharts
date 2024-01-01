import React from 'react'
import Flow from './Flow'

class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  componentDidMount () {

  }

  render () {
    return (
      <div style={{ width: '100%' }}>
        <Flow />
      </div>
    )
  }
}

export default App;
