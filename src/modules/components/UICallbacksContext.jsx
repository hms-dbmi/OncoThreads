import React, { createContext, useContext } from 'react';

/**
 * Context for UI callback functions that were previously prop-drilled
 * through the component tree (tooltipFunctions, openSaveVarModal,
 * openBinningModal, showContextMenu, showContextMenuHeatmapRow).
 *
 * Provided by Content.jsx, consumed by leaf components.
 */
export const UICallbacksContext = createContext(null);

/**
 * Hook for functional components to access UI callbacks.
 */
export const useUICallbacks = () => useContext(UICallbacksContext);

/**
 * HOC for class components to access UI callbacks via props.
 * Injects: tooltipFunctions, openSaveVarModal, openBinningModal,
 * showContextMenu, showContextMenuHeatmapRow
 */
export function withUICallbacks(Component) {
	const displayName = Component.displayName || Component.name || 'Component';

	function WrappedComponent(props) {
		const uiCallbacks = useUICallbacks();
		return <Component {...uiCallbacks} {...props} />;
	}

	WrappedComponent.displayName = `withUICallbacks(${displayName})`;
	return WrappedComponent;
}
