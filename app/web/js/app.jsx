import { h, render, Component } from 'preact';

class App extends Component {
    render() {
        return <span>Hej</span>;
    }
}

render(<App />, document.getElementById('root'));

