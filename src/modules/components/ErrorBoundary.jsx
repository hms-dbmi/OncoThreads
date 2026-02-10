import React from 'react';
import { Result, Button } from 'antd';
import { message } from 'antd';

/**
 * Error Boundary component to catch React component errors
 * Displays user-friendly error UI with recovery options
 */
class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error) {
		// Update state so next render shows fallback UI
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		// Log error details
		this.setState({ errorInfo });
		console.error('Error Boundary caught:', error, errorInfo);

		// Show non-blocking notification
		message.error({
			content: `Something went wrong: ${error.message}`,
			duration: 5,
		});
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null, errorInfo: null });
	};

	handleReload = () => {
		window.location.reload();
	};

	handleCopyError = () => {
		const errorDetails = `
Error: ${this.state.error?.message || 'Unknown error'}
Stack: ${this.state.error?.stack || 'No stack trace'}
Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}
        `.trim();

		navigator.clipboard
			.writeText(errorDetails)
			.then(() => {
				message.success('Error details copied to clipboard');
			})
			.catch((err) => {
				console.error('Failed to copy error details:', err);
				message.error('Failed to copy error details');
			});
	};

	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: '50px 20px', maxWidth: 800, margin: '0 auto' }}>
					<Result
						status="error"
						title="Something went wrong"
						subTitle={
							this.state.error?.message ||
							'An unexpected error occurred. You can try again or reload the page.'
						}
						extra={[
							<Button type="primary" key="reset" onClick={this.handleReset}>
								Try Again
							</Button>,
							<Button key="reload" onClick={this.handleReload}>
								Reload Page
							</Button>,
							<Button key="copy" onClick={this.handleCopyError}>
								Copy Error Details
							</Button>,
						]}
					>
						{process.env.NODE_ENV === 'development' && this.state.error && (
							<div
								style={{
									textAlign: 'left',
									marginTop: 24,
									padding: 16,
									background: '#f5f5f5',
									borderRadius: 4,
									fontSize: 12,
									overflow: 'auto',
								}}
							>
								<details>
									<summary style={{ cursor: 'pointer', marginBottom: 8 }}>
										<strong>Error Details (Development Mode)</strong>
									</summary>
									<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
										{this.state.error.stack}
									</pre>
									{this.state.errorInfo && (
										<>
											<strong>Component Stack:</strong>
											<pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
												{this.state.errorInfo.componentStack}
											</pre>
										</>
									)}
								</details>
							</div>
						)}
					</Result>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
