import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'mobx-react';
import App from './App';
import RootStore from '../../RootStore';
import UndoRedoStore from '../../UndoRedoStore';
import UIStore from '../../UIStore';
import StudyAPI from '../../../studyAPI';

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
            <App
                parsed="false"
                firstload="false"
            />
        </Provider>, div,
    );
    ReactDOM.unmountComponentAtNode(div);
});
