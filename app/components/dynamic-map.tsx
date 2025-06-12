import { lazy, Suspense } from "react";
import type { MapProps } from "./map";

const LazyMap = lazy(() => import("./map"));

const DynamicMap = (props: MapProps) => {
  return (
    <Suspense fallback={<div>Loading map...</div>}>
      <LazyMap {...props} />
    </Suspense>
  );
};

export default DynamicMap;
