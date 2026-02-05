 
/**
 * Created by theresa on 30.01.18.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'mobx-react';

// Bootstrap CSS for react-bootstrap components
import 'bootstrap/dist/css/bootstrap.min.css';

// Intro.js styles
import 'intro.js/minified/introjs.min.css';
import 'intro.js/themes/introjs-modern.css';
import './introjs-custom.css'

// Grid layout styles
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

// Font Awesome for react-fontawesome
import 'font-awesome/css/font-awesome.min.css';

// Application styles
import './style.css';
import './lineUp.css';

import App from './modules/components/App.jsx';
import RootStore from './modules/stores/RootStore';
import UIStore from './modules/stores/UIStore';
import UndoRedoStore from './modules/stores/UndoRedoStore';
import StudyAPI from './API/studyAPI';

const uiStore = new UIStore();
const studyAPI = new StudyAPI(uiStore);
const rootStore = new RootStore(uiStore, studyAPI);
const undoRedoStore = new UndoRedoStore(rootStore, uiStore);
// Don't load studies on app initialization - defer until user opens study selection
// studyAPI.loadDefaultStudies();

const root = createRoot(document.getElementById('app'));
root.render(
    <Provider
        rootStore={rootStore}
        uiStore={uiStore}
        undoRedoStore={undoRedoStore}
    >
        <App />
    </Provider>
);
