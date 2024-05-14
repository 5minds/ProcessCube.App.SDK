import BpmnViewer from 'bpmn-js/lib/Viewer';
import clsx from 'clsx';
import type Canvas from 'diagram-js/lib/core/Canvas';
import type ElementRegistry from 'diagram-js/lib/core/ElementRegistry';
import type Overlays from 'diagram-js/lib/features/overlays/Overlays';
import SelectionModule from 'diagram-js/lib/features/selection';
import type Selection from 'diagram-js/lib/features/selection/Selection';
import type { ElementLike } from 'diagram-js/lib/model/Types';
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas';
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll';
import dynamic from 'next/dynamic';
import { ForwardedRef, Ref, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import React from 'react';

export type BPMNViewerProps = {
  xml: string;
  className?: string;
  preselectedElementIds?: string[];
  onSelectionChanged?: (elements: Array<ElementLike>) => void;
  onImportDone?: () => void;
};

export type BPMNViewerFunctions = {
  getOverlays(): Overlays;
  getElementRegistry(): ElementRegistry;
};

function BPMNViewerFunction(props: BPMNViewerProps, ref: Ref<BPMNViewerFunctions>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnViewer>(
    new BpmnViewer({
      bpmnRenderer: {
        defaultFillColor: 'var(--asdk-bv-fill-color)',
        defaultStrokeColor: 'var(--asdk-bv-stroke-color)',
      },
      additionalModules: [ZoomScrollModule, MoveCanvasModule, SelectionModule],
    }),
  );

  useImperativeHandle(
    ref,
    () => {
      return {
        getOverlays() {
          return viewerRef.current.get<Overlays>('overlays');
        },
        getElementRegistry() {
          return viewerRef.current.get<ElementRegistry>('elementRegistry');
        },
      };
    },
    [],
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const viewer = viewerRef.current;
    viewer.attachTo(containerRef.current);

    const canvas = viewer.get<Canvas>('canvas');

    const onSelectionChange = (event: { newSelection: ElementLike[] }) => {
      props.onSelectionChanged?.(event.newSelection);
    };

    viewer
      .importXML(props.xml)
      .then(() => {
        const viewbox = canvas.viewbox();
        const center = {
          x: viewbox.outer.width / 2,
          y: viewbox.outer.height / 2,
        };

        canvas.zoom('fit-viewport', center);

        props.onImportDone?.();
        viewer.on('selection.changed', onSelectionChange);

        const { preselectedElementIds } = props;
        if (!preselectedElementIds || preselectedElementIds.length === 0) {
          return;
        }

        const registry = viewer.get<ElementRegistry>('elementRegistry');
        const preselectedElements = registry
          .filter((element) => preselectedElementIds.includes(element.id))
          .sort((a, b) => preselectedElementIds.indexOf(a.id) - preselectedElementIds.indexOf(b.id));

        viewer.get<Selection>('selection').select(preselectedElements ?? []);
      })
      .catch((err) => {
        console.error(err);
      });

    return () => {
      viewer.off('selection.changed', onSelectionChange);
      viewer.detach();
    };
  }, [props.xml, props.preselectedElementIds]);

  return <div ref={containerRef} className={clsx('app-sdk-bpmn-viewer', 'app-sdk-h-full', props.className)} />;
}

export const BPMNViewer = forwardRef(BPMNViewerFunction);

export type BPMNViewerNextJSProps = BPMNViewerProps & {
  viewerRef?: ForwardedRef<BPMNViewerFunctions>;
};

/**
 *
 * Nextjs has problems to pass a ref to a function component that was loaded via dynamic() import().
 * This wrapper enables passing refs.
 */
function ForwardedBPMNViewer(props: BPMNViewerNextJSProps) {
  return <BPMNViewer {...props} ref={props.viewerRef} />;
}

export const BPMNViewerNextJS = dynamic(() => Promise.resolve(ForwardedBPMNViewer), {
  ssr: false,
});
