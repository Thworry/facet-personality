import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';
import './styles/responsive.css';
import { createAppController } from './app/controller';

const app = document.querySelector<HTMLElement>('#app');

if (app === null) {
  throw new Error('FACET application root was not found');
}

createAppController(app);
