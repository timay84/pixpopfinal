import {createRoot} from 'react-dom/client';
import Home from './app/page';
import Models from './app/models/page';
import './app/globals.css';

const isModelPage=/^\/models\/?$/.test(window.location.pathname);
createRoot(document.getElementById('root')!).render(isModelPage ? <Models/> : <Home/>);
