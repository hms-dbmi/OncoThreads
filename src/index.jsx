/* eslint-disable react/jsx-filename-extension */
/**
 * Created by theresa on 30.01.18.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'mobx-react';
import 'intro.js/minified/introjs.min.css';
import 'intro.js/themes/introjs-modern.css';
import './introjs-custom.css'

import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

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
