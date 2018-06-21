import React from 'react';
import {observer} from 'mobx-react';
import {Button, Modal} from 'react-bootstrap';


const LogModal = observer(class ContinuousBinner extends React.Component {
    getFormattedLogs(){
        let formattedLogs=[];
        this.props.logs.forEach(function (d,i) {
            formattedLogs.push(<p key={i}>{d}</p>)
        });
        return formattedLogs;
    }
    render() {
        return (
            <Modal
                show={this.props.modalIsOpen}
                onHide={this.props.close}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Logs</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{'maxHeight': '400px', 'overflowY': 'auto'}}>
                    {this.getFormattedLogs()}
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.props.close}>Close</Button>
                </Modal.Footer>
            </Modal>
        )
    }
});
export default LogModal;