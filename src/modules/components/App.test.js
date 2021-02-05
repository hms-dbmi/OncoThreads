import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import App from './App';
import RootStore from '../stores/RootStore';
import UndoRedoStore from '../stores/UndoRedoStore';
import UIStore from '../stores/UIStore';
import StudyAPI from '../../studyAPI';

it('renders without crashing', () => {
    const uiStore = new UIStore();
    const studyAPI = new StudyAPI(uiStore);
    const rootStore = new RootStore(uiStore, studyAPI);
    const undoRedoStore = new UndoRedoStore(rootStore, uiStore);
    const div = document.createElement('div');
    ReactDOM.render(
        <Provider
            rootStore={rootStore}
            uiStore={uiStore}
            undoRedoStore={undoRedoStore}
        >
            <App />
        </Provider>, div,
    );
    ReactDOM.unmountComponentAtNode(div);
});
