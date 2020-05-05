import './App.css';
import { createComponent } from '@vue/composition-api';
import HelloWorld from './components/demo3';
import ImageLogo from './assets/logo.png';

export default createComponent({
  name: 'App',
  setup() {
    return () => (
      <div id="app">
        <img alt="Vue" src={ImageLogo} />
        <HelloWorld />
      </div>
    );
  },
});
