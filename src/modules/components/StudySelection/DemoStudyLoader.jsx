import React from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Alert, Card, Form } from 'react-bootstrap';
import { CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { makeObservable, observable, action } from 'mobx';
import axios from 'axios';
import ErrorHandler from '../../services/ErrorHandler';

/**
 * Component for loading demo study data
 * Supports loading either:
 * 1. Local demo study from data/demo_study/ directory (comprehensive dataset)
 * 2. Remote Synthea COVID study from threadstates.gehlenborglab.org (timeline and clinical only)
 */
const DemoStudyLoader = inject('rootStore')(
	observer(
		class DemoStudyLoader extends React.Component {
			loading = false;
			error = null;
			selectedDemo = 'local'; // 'local' or 'covid'
			filesLoaded = {
				timeline: false,
				clinicalSample: false,
				clinicalPatient: false,
				mutations: false,
				cna: false,
				expression: false,
				panelMatrix: false,
				genePanels: false,
			};

			constructor(props) {
				super(props);
				makeObservable(this, {
					loading: observable,
					error: observable,
					selectedDemo: observable,
					filesLoaded: observable,
					loadDemoStudy: action,
					loadCovidDemoStudy: action,
					handleLoadButtonClick: action,
					setLoading: action,
					setError: action,
					setFileLoaded: action,
					setSelectedDemo: action,
				});
			}

			setLoading = (isLoading) => {
				this.loading = isLoading;
			};

			setError = (error) => {
				this.error = error;
			};

			setFileLoaded = (fileType, loaded) => {
				this.filesLoaded[fileType] = loaded;
			};

			setSelectedDemo = (demo) => {
				this.selectedDemo = demo;
				// Reset file loaded status when switching demo types
				this.filesLoaded = {
					timeline: false,
					clinicalSample: false,
					clinicalPatient: false,
					mutations: false,
					cna: false,
					expression: false,
					panelMatrix: false,
					genePanels: false,
				};
			};

			/**
			 * Fetch a file from the data/demo_study directory and convert to File object
			 * @param {string} filename - Name of the file to fetch
			 * @returns {Promise<File>} - Promise that resolves to a File object
			 */
			async fetchDemoFile(filename) {
				try {
					const response = await fetch(`/data/demo_study/${filename}`);
					if (!response.ok) {
						throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
					}
					const blob = await response.blob();
					return new File([blob], filename, { type: 'text/plain' });
				} catch (error) {
					console.error(`Error fetching ${filename}:`, error);
					throw error;
				}
			}

			/**
			 * Load all demo study files
			 */
			loadDemoStudy = async () => {
				this.setLoading(true);
				this.setError(null);

				try {
					const loader = this.props.rootStore.localFileLoader;

					// 1. Load timeline files (required)
					try {
						const timelineFiles = await Promise.all([
							this.fetchDemoFile('data_timeline_specimen.txt'),
							this.fetchDemoFile('data_timeline_status.txt'),
							this.fetchDemoFile('data_timeline_surgery.txt'),
							this.fetchDemoFile('data_timeline_treatment.txt'),
						]);

						// Convert to FileList-like object
						const fileList = Object.assign(timelineFiles, { item: (i) => timelineFiles[i] });

						loader.setEventFiles(fileList, () => {
							this.props.rootStore.parseTimeline(null, () => {});
						});
						this.setFileLoaded('timeline', true);
						console.log('✓ Timeline files loaded');
					} catch (error) {
						console.error('Failed to load timeline files:', error);
						throw new Error('Failed to load timeline files');
					}

					// 2. Load clinical sample data (required)
					try {
						const clinicalSampleFile = await this.fetchDemoFile('data_clinical_sample.txt');
						loader.setClinicalFile(clinicalSampleFile, true);
						this.setFileLoaded('clinicalSample', true);
						console.log('✓ Clinical sample data loaded');
					} catch (error) {
						console.error('Failed to load clinical sample data:', error);
						throw new Error('Failed to load clinical sample data');
					}

					// 3. Load clinical patient data (required)
					try {
						const clinicalPatientFile = await this.fetchDemoFile('data_clinical_patient.txt');
						loader.setClinicalFile(clinicalPatientFile, false);
						this.setFileLoaded('clinicalPatient', true);
						console.log('✓ Clinical patient data loaded');
					} catch (error) {
						console.error('Failed to load clinical patient data:', error);
						throw new Error('Failed to load clinical patient data');
					}

					// 4. Load mutations (optional)
					try {
						const mutationsFile = await this.fetchDemoFile('data_mutations_extended.txt');
						loader.setMutations(mutationsFile);
						this.setFileLoaded('mutations', true);
						console.log('✓ Mutations data loaded');
					} catch (error) {
						console.warn('Mutations file not loaded:', error);
					}

					// 5. Load molecular data files (optional)
					try {
						const molecularFiles = await Promise.all([
							this.fetchDemoFile('data_CNA.txt'),
							this.fetchDemoFile('data_RNA_Seq_v2_expression_median.txt'),
						]);

						// Convert to FileList-like object
						const fileList = Object.assign(molecularFiles, { item: (i) => molecularFiles[i] });

						// Define metadata for each molecular file
						const metaData = [
							{ key: 'CNA', alterationType: 'COPY_NUMBER_ALTERATION', datatype: 'DISCRETE' },
							{ key: 'mRNA', alterationType: 'MRNA_EXPRESSION', datatype: 'CONTINUOUS' },
						];

						loader.setMolecularFiles(fileList, metaData);
						this.setFileLoaded('cna', true);
						this.setFileLoaded('expression', true);
						console.log('✓ Molecular data loaded');
					} catch (error) {
						console.warn('Molecular files not fully loaded:', error);
					}

					// 6. Load gene panel matrix (optional)
					try {
						const panelMatrixFile = await this.fetchDemoFile('data_gene_matrix.txt');
						loader.setGenePanelMatrix(panelMatrixFile);
						this.setFileLoaded('panelMatrix', true);
						console.log('✓ Gene panel matrix loaded');
					} catch (error) {
						console.warn('Gene panel matrix not loaded:', error);
					}

					// 7. Load gene panels (optional)
					try {
						const genePanelFiles = await Promise.all([
							this.fetchDemoFile('data_gene_panel_impact341.txt'),
							this.fetchDemoFile('data_gene_panel_impact410.txt'),
						]);

						// Convert to FileList-like object
						const fileList = Object.assign(genePanelFiles, { item: (i) => genePanelFiles[i] });

						loader.setGenePanels(fileList);
						this.setFileLoaded('genePanels', true);
						console.log('✓ Gene panels loaded');
					} catch (error) {
						console.warn('Gene panels not loaded:', error);
					}

					ErrorHandler.showSuccess('Demo study loaded successfully!');
					this.setLoading(false);
				} catch (error) {
					console.error('Error loading demo study:', error);
					this.setError(error.message);
					ErrorHandler.showError(`Failed to load demo study: ${error.message}`);
					this.setLoading(false);
				}
			};

			/**
			 * Load COVID demo study from remote server
			 */
			loadCovidDemoStudy = async () => {
				this.setLoading(true);
				this.setError(null);

				try {
					const loader = this.props.rootStore.localFileLoader;

					// Create axios instance with CORS configuration
					const axiosInstance = axios.create({
						baseURL: 'https://threadstates.gehlenborglab.org/demo_data/',
						withCredentials: false,
						headers: {
							'Access-Control-Allow-Origin': '*',
							'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
						},
					});

					// 1. Load timeline files
					try {
						const timelineResponses = await Promise.all([
							axiosInstance.get('covid_100_timeline_med.txt'),
							axiosInstance.get('covid_100_timeline_samples.txt'),
						]);

						const timelineData = timelineResponses.map((res) => res.data);

						loader.setEventFiles(timelineData, () => {
							this.props.rootStore.parseTimeline(null, () => {});
						});
						this.setFileLoaded('timeline', true);
						console.log('✓ COVID timeline files loaded');
					} catch (error) {
						console.error('Failed to load COVID timeline files:', error);
						throw new Error('Failed to load COVID timeline files');
					}

					// 2. Load clinical sample data
					try {
						const samplesResponse = await axiosInstance.get('covid_100_samples.txt');
						loader.setClinicalFile(samplesResponse.data, true);
						this.setFileLoaded('clinicalSample', true);
						console.log('✓ COVID samples data loaded');
					} catch (error) {
						console.error('Failed to load COVID samples data:', error);
						throw new Error('Failed to load COVID samples data');
					}

					// 3. Load clinical patient data
					try {
						const patientsResponse = await axiosInstance.get('covid_100_patients.txt');
						loader.setClinicalFile(patientsResponse.data, false);
						this.setFileLoaded('clinicalPatient', true);
						console.log('✓ COVID patients data loaded');
					} catch (error) {
						console.error('Failed to load COVID patients data:', error);
						throw new Error('Failed to load COVID patients data');
					}

					ErrorHandler.showSuccess('COVID demo study loaded successfully!');
					this.setLoading(false);
				} catch (error) {
					console.error('Error loading COVID demo study:', error);
					this.setError(error.message);
					ErrorHandler.showError(`Failed to load COVID demo study: ${error.message}`);
					this.setLoading(false);
				}
			};

			/**
			 * Handle load button click - dispatches to appropriate loader based on selection
			 */
			handleLoadButtonClick = () => {
				if (this.selectedDemo === 'local') {
					this.loadDemoStudy();
				} else if (this.selectedDemo === 'covid') {
					this.loadCovidDemoStudy();
				}
			};

			/**
			 * Render file status indicator
			 * @param {string} label - File type label
			 * @param {boolean} loaded - Whether file is loaded
			 * @returns {JSX.Element}
			 */
			renderFileStatus(label, loaded) {
				return (
					<div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
						{loaded ? (
							<CheckCircleOutlined style={{ color: 'green', marginRight: '8px', fontSize: '16px' }} />
						) : (
							<div style={{ width: '16px', height: '16px', marginRight: '8px' }} />
						)}
						<span style={{ color: loaded ? 'green' : '#666' }}>{label}</span>
					</div>
				);
			}

			render() {
				const loader = this.props.rootStore.localFileLoader;
				const isDataReady = loader.dataReady;

				return (
					<div style={{ marginTop: '20px', marginBottom: '20px' }}>
						<Card>
							<Card.Body>
								<h5>Demo Study</h5>
								<p>
									Load a pre-configured demo study with sample timeline, clinical, and molecular data.
									This is a great way to explore the application's features.
								</p>

								{/* Demo study selector */}
								<div style={{ marginBottom: '20px' }}>
									<strong>Select demo study:</strong>
									<Form style={{ marginTop: '12px', marginLeft: '8px' }}>
										<Form.Check
											type="radio"
											id="demo-local"
											label="Local Demo Study (comprehensive data with mutations, CNA, expression)"
											checked={this.selectedDemo === 'local'}
											onChange={() => this.setSelectedDemo('local')}
											disabled={this.loading || isDataReady}
										/>
										<Form.Check
											type="radio"
											id="demo-covid"
											label="Synthea COVID Study (remote, timeline and clinical data only)"
											checked={this.selectedDemo === 'covid'}
											onChange={() => this.setSelectedDemo('covid')}
											disabled={this.loading || isDataReady}
											style={{ marginTop: '8px' }}
										/>
									</Form>
								</div>

								{this.error && (
									<Alert variant="danger" style={{ marginBottom: '16px' }}>
										<strong>Error:</strong> {this.error}
									</Alert>
								)}

								{this.loading && (
									<Alert variant="info" style={{ marginBottom: '16px' }}>
										<LoadingOutlined style={{ marginRight: '8px' }} />
										Loading demo study files...
									</Alert>
								)}

								{isDataReady && (
									<Alert variant="success" style={{ marginBottom: '16px' }}>
										<CheckCircleOutlined style={{ marginRight: '8px' }} />
										Demo study loaded successfully! Click "Launch" below to view the data.
									</Alert>
								)}

								<div style={{ marginTop: '16px', marginBottom: '16px' }}>
									<strong>Files to be loaded:</strong>
									<div style={{ marginTop: '12px', marginLeft: '8px' }}>
										{this.selectedDemo === 'local' ? (
											<>
												{this.renderFileStatus(
													'Timeline data (specimen, status, surgery, treatment)',
													this.filesLoaded.timeline
												)}
												{this.renderFileStatus(
													'Clinical sample data',
													this.filesLoaded.clinicalSample
												)}
												{this.renderFileStatus(
													'Clinical patient data',
													this.filesLoaded.clinicalPatient
												)}
												{this.renderFileStatus('Mutations data', this.filesLoaded.mutations)}
												{this.renderFileStatus(
													'Copy number alterations (CNA)',
													this.filesLoaded.cna
												)}
												{this.renderFileStatus(
													'RNA-Seq expression data',
													this.filesLoaded.expression
												)}
												{this.renderFileStatus(
													'Gene panel matrix',
													this.filesLoaded.panelMatrix
												)}
												{this.renderFileStatus(
													'Gene panels (IMPACT 341, 410)',
													this.filesLoaded.genePanels
												)}
											</>
										) : (
											<>
												{this.renderFileStatus(
													'COVID timeline data (medications, samples)',
													this.filesLoaded.timeline
												)}
												{this.renderFileStatus(
													'COVID samples data',
													this.filesLoaded.clinicalSample
												)}
												{this.renderFileStatus(
													'COVID patients data',
													this.filesLoaded.clinicalPatient
												)}
											</>
										)}
									</div>
								</div>

								<Button
									variant="primary"
									onClick={this.handleLoadButtonClick}
									disabled={this.loading || isDataReady}
								>
									{this.loading
										? 'Loading...'
										: isDataReady
											? 'Demo Study Loaded'
											: `Load ${this.selectedDemo === 'local' ? 'Local' : 'COVID'} Demo Study`}
								</Button>
							</Card.Body>
						</Card>
					</div>
				);
			}
		}
	)
);

export default DemoStudyLoader;
