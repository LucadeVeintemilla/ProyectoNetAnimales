import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';

type CleanupFn = (() => void) | void;
type ReportHandler = (metric: Metric) => void;

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    // Store cleanup functions to be called when the component unmounts
    const cleanupFns: CleanupFn[] = [];

    // Track each metric and store their cleanup functions
    const trackMetric = (trackFn: (callback: ReportHandler) => CleanupFn) => {
      const cleanup = trackFn(onPerfEntry);
      if (cleanup) {
        cleanupFns.push(cleanup);
      }
    };

    // Track each metric
    trackMetric(onCLS);     // Cumulative Layout Shift
    trackMetric(onFCP);     // First Contentful Paint
    trackMetric(onLCP);     // Largest Contentful Paint
    trackMetric(onTTFB);    // Time to First Byte
    trackMetric(onINP);     // Interaction to Next Paint (replaces FID in v5+)


    // Return a cleanup function to stop observing all metrics
    return () => {
      cleanupFns.forEach(cleanup => cleanup && cleanup());
    };
  }
};

export default reportWebVitals;
