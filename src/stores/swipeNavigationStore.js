import React, { createContext, useContext, useRef, useCallback } from 'react';

const SwipeNavigationContext = createContext({
  swipeEnabledRef: { current: true },
  setSwipeEnabled: () => {},
});

export const SwipeNavigationProvider = ({ children }) => {
  const swipeEnabledRef = useRef(true);

  const setSwipeEnabled = useCallback((enabled) => {
    swipeEnabledRef.current = Boolean(enabled);
  }, []);

  const value = React.useMemo(
    () => ({ swipeEnabledRef, setSwipeEnabled }),
    [setSwipeEnabled]
  );

  return (
    <SwipeNavigationContext.Provider value={value}>
      {children}
    </SwipeNavigationContext.Provider>
  );
};

export const useSwipeNavigation = () => useContext(SwipeNavigationContext);

export default SwipeNavigationContext;
