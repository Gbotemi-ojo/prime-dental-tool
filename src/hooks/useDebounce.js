// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

function useDebounce(value, delay) {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if the value changes before the delay,
    // or if the component unmounts.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-run effect if value or delay changes

  return debouncedValue;
}

export default useDebounce;