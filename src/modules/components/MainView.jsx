import React from 'react';
import { inject, observer } from 'mobx-react';
import { Tab, Tabs } from 'react-bootstrap';
import GlobalTimeline from './GlobalTimeline';
import BlockView from './BlockView';
import MyBlockView from './BlockViewNew';
import StateTransition from './StateTransition';
import { Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

/**
 * Component containing the main visualization.
 * All UI callbacks (tooltipFunctions, openSaveVarModal, etc.)
 * are now provided via UICallbacksContext from Content.jsx.
 */
const MainView = inject(
	'rootStore',
	'uiStore',
	'undoRedoStore'
)(
	observer(
		class MainView extends React.Component {
			constructor(props) {
				super(props);
				this.handleSwitchView = this.handleSwitchView.bind(this);
			}

			handleSwitchView(key) {
				if (key !== this.props.uiStore.selectedTab) {
					this.props.uiStore.selectTab(key);
					this.props.undoRedoStore.saveSwitchHistory(this.props.uiStore.selectedTab);
				}
			}

			getTabbedPanel() {
				const stateTransition = <StateTransition />;
				const myblockView = <MyBlockView />;
				const timelineView = <GlobalTimeline />;
				const blockView = <BlockView />;

				const dataIntro = `<h4>To start with, select different views to analyze the clinical sequences from different aspects.</h4>
        <b>Block View</b> groups patients at each timepoint based on their values of one selected feature.<br/><br/>
        <b>State Transition</b>  provides a more advanced analysis and enables state identification using timepoint features.<br/><br/>
        <b>Timeline View</b> shows the individual clinical sequence of each patient.`;

				return (
					<Tabs
						style={{ width: '100%' }}
						mountOnEnter
						unmountOnExit
						activeKey={this.props.uiStore.selectedTab}
						onSelect={this.handleSwitchView}
						id="viewTab"
						data-intro={dataIntro}
						data-step="1"
						data-position="right"
					>
						<Tab
							eventKey="block"
							style={{ paddingTop: 10 }}
							title={
								<span>
									Block View{' '}
									<Tooltip title="Patients are grouped at each timepoint by their attribute values">
										<InfoCircleOutlined />
									</Tooltip>
								</span>
							}
						>
							{blockView}
						</Tab>

						<Tab
							eventKey="myblock"
							style={{ paddingTop: 10 }}
							title={
								<span>
									Block V2{' '}
									<Tooltip title="Patients are grouped at each timepoint by the identified states">
										<InfoCircleOutlined />
									</Tooltip>
								</span>
							}
						>
							{myblockView}
						</Tab>
						<Tab
							eventKey="stateTransition"
							style={{ paddingTop: 10 }}
							title={
								<span>
									State Transitions{' '}
									<Tooltip title="States are identified and the transition among states are presented">
										<InfoCircleOutlined />
									</Tooltip>
								</span>
							}
						>
							{stateTransition}
						</Tab>

						<Tab
							eventKey="line"
							style={{ paddingTop: 10 }}
							title={
								<span>
									Timeline{' '}
									<Tooltip title="The timelines of individual patients">
										<InfoCircleOutlined />
									</Tooltip>
								</span>
							}
						>
							{timelineView}
						</Tab>
					</Tabs>
				);
			}

			componentDidUpdate() {
				const { uiStore } = this.props;

				if (uiStore.selectedTab === 'stateTransition' && uiStore.introTutorial !== undefined) {
					uiStore.setTutorialMode(false);
					uiStore.setTutorialMode(true);
				}
			}

			render() {
				if (
					this.props.rootStore.dataStore.variableStores.sample.currentVariables.length > 0 ||
					this.props.rootStore.dataStore.variableStores.between.currentVariables.length > 0
				) {
					return this.getTabbedPanel();
				} else {
					const noDataText =
						'No data currently selected. Use "Add" button or "Feature Manager" to select one or more timepoint features';
					return (
						<div style={{ height: this.props.rootStore.visStore.plotHeight }}>
							<div className="centeredText">{noDataText}</div>
						</div>
					);
				}
			}
		}
	)
);
export default MainView;
