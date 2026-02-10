import React from 'react';
import { Spin, Progress, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

/**
 * Reusable loading state component with optional progress indicator
 * Provides consistent loading UI across the application
 *
 * @param {Object} props
 * @param {string} props.message - Message to display below the spinner
 * @param {number|null} props.progress - Progress percentage (0-100) or null for indeterminate
 * @param {string} props.size - Size of the spinner: 'small' | 'default' | 'large'
 * @param {boolean} props.showProgress - Whether to show progress bar
 * @param {boolean} props.fullPage - If true, centers in full page; otherwise just centers in container
 * @param {React.ReactNode} props.children - Additional content to render below the loading indicator
 */
const LoadingState = ({
	message = 'Loading...',
	progress = null,
	size = 'default',
	showProgress = false,
	fullPage = false,
	children = null,
}) => {
	const spinnerSize = size === 'small' ? 24 : size === 'large' ? 48 : 32;
	const customIcon = <LoadingOutlined style={{ fontSize: spinnerSize }} spin />;

	const containerStyle = {
		textAlign: 'center',
		padding: fullPage ? '100px 20px' : '40px 20px',
		minHeight: fullPage ? '100vh' : 'auto',
		display: fullPage ? 'flex' : 'block',
		flexDirection: fullPage ? 'column' : undefined,
		justifyContent: fullPage ? 'center' : undefined,
		alignItems: fullPage ? 'center' : undefined,
	};

	return (
		<div style={containerStyle}>
			<Spin indicator={customIcon} size={size} />
			{message && (
				<Text
					style={{
						display: 'block',
						marginTop: 16,
						fontSize: size === 'large' ? 16 : size === 'small' ? 12 : 14,
						color: '#666',
					}}
				>
					{message}
				</Text>
			)}
			{showProgress && progress !== null && (
				<Progress
					percent={Math.round(progress)}
					style={{
						maxWidth: 400,
						margin: '16px auto 0',
						padding: '0 20px',
					}}
					status={progress === 100 ? 'success' : 'active'}
					strokeColor={{
						'0%': '#108ee9',
						'100%': '#87d068',
					}}
				/>
			)}
			{children && <div style={{ marginTop: 16 }}>{children}</div>}
		</div>
	);
};

export default LoadingState;
