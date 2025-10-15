import BpmnViewer from 'bpmn-js/lib/Viewer';
import OutlineModule from 'bpmn-js/lib/features/outline';
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
import React, { ForwardedRef, Ref, forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import './BPMNHeatmap.css';

export type BPMNViewerProps = {
  xml: string;
  className?: string;
  preselectedElementIds?: string[];
  onSelectionChanged?: (elements: Array<ElementLike>) => void;
  onImportDone?: () => void;
};

export type BPMNViewerFunctions = {
  getOverlays(): Overlays | undefined;
  getElementRegistry(): ElementRegistry | undefined;
  addMarker(elementId: string, className: string): void;
  removeMarker(elementId: string, className: string): void;
  hasMarker(elementId: string, className: string): boolean | undefined;
  showHeatmap(data: Record<string, string>): void;
  clearHeatmap(data: string[]): void;
};

const DEFAULT_VIEWER_OPTIONS = {
  canvas: {
    autoFocus: true,
  },
};

const statusColors: Record<string, string> = {
  Critical: 'rgb(255, 0, 0)',
  Warning: 'rgb(255, 220, 0)',
  Stable: 'rgb(50, 205, 50)',
};

function BPMNViewerFunction(props: BPMNViewerProps, ref: Ref<BPMNViewerFunctions>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnViewer>(
    new BpmnViewer({
      bpmnRenderer: {
        defaultFillColor: 'var(--asdk-bv-background-color)',
        defaultStrokeColor: 'var(--asdk-bv-foreground-color)',
      },
      additionalModules: [ZoomScrollModule, MoveCanvasModule, SelectionModule, OutlineModule],
      ...DEFAULT_VIEWER_OPTIONS,
    }),
  );
  const originalColors = useRef<Record<string, string>>({});

  useImperativeHandle(ref, () => {
    return {
      getOverlays() {
        return viewerRef.current.get<Overlays>('overlays');
      },
      getElementRegistry() {
        return viewerRef.current.get<ElementRegistry>('elementRegistry');
      },
      addMarker(elementId: string, className: string) {
        viewerRef.current.get<Canvas>('canvas')?.addMarker(elementId, className);
      },
      removeMarker(elementId: string, className: string) {
        viewerRef.current.get<Canvas>('canvas')?.removeMarker(elementId, className);
      },
      hasMarker(elementId: string, className: string) {
        return viewerRef.current.get<Canvas>('canvas')?.hasMarker(elementId, className);
      },
      showHeatmap(data: Record<string, string>) {
        const registry = viewerRef.current.get<ElementRegistry>('elementRegistry');
        if (!registry) return;

        for (const [elementId, status] of Object.entries(data)) {
          const element = registry.get(elementId);
          if (!element) continue;

          const gfx = registry.getGraphics(element) as SVGGElement | undefined;
          if (!gfx) continue;

          const visual = gfx.querySelector('.djs-visual > :first-child') as SVGElement | null;
          const textVisual = gfx.querySelector('.djs-visual > :nth-child(2)') as SVGElement | null;

          if (!visual) continue;

          const svg = gfx.ownerSVGElement;
          if (!svg) return;

          const gradientId = `heatmap-gradient-${elementId}`;

          let existingGradient = svg.querySelector(`#${gradientId}`);
          if (existingGradient) {
            existingGradient.remove();
          }

          const defs =
            svg.querySelector('defs') ||
            (() => {
              const d = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
              svg.insertBefore(d, svg.firstChild);
              return d;
            })();

          const radialGradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
          radialGradient.setAttribute('id', gradientId);
          radialGradient.setAttribute('cx', '50%');
          radialGradient.setAttribute('cy', '50%');
          radialGradient.setAttribute('r', '90%');
          radialGradient.setAttribute('fx', '50%');
          radialGradient.setAttribute('fy', '50%');

          const color = statusColors[status];

          const stops = [
            { offset: '0%', color },
            { offset: '50%', color },
            { offset: '100%', color },
          ];

          stops.forEach(({ offset, color }) => {
            const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop.setAttribute('offset', offset);
            stop.setAttribute('stop-color', color);
            radialGradient.appendChild(stop);
          });

          defs.appendChild(radialGradient);

          visual.classList.forEach((cls) => {
            if (cls.startsWith('heatmap-')) {
              visual.classList.remove(cls);
            }
          });

          if (textVisual) textVisual.style.fill = '#1d1d1d';
          visual.classList.add(`heatmap-${status.toLowerCase()}`);
          visual.style.fill = `url(#${gradientId})`;
        }
      },
      clearHeatmap(data: string[]) {
        const registry = viewerRef.current.get<ElementRegistry>('elementRegistry');
        if (!registry) return;

        for (const elementId of data) {
          const element = registry.get(elementId);
          if (!element) continue;

          const gfx = registry.getGraphics(element) as SVGGElement | undefined;
          if (!gfx) continue;

          const visual = gfx.querySelector('.djs-visual > :first-child') as SVGElement | null;
          const textVisual = gfx.querySelector('.djs-visual > :nth-child(2)') as SVGElement | null;

          if (visual) {
            visual.classList.forEach((cls) => {
              if (cls.startsWith('heatmap-')) {
                visual.classList.remove(cls);
              }
            });

            if (textVisual && visual) {
              const strokeColor = visual.style.stroke;
              textVisual.style.fill = strokeColor;
            }

            visual.style.fill = originalColors.current[elementId] || '';
          }

          const svg = gfx.ownerSVGElement;
          if (!svg) continue;

          const gradientId = `heatmap-gradient-${element.id}`;
          const gradient = svg.querySelector(`#${gradientId}`);
          if (gradient) {
            gradient.remove();
          }
        }
      },
    };
  }, [viewerRef.current, containerRef.current]);

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

        const registry = viewer.get<ElementRegistry>('elementRegistry');
        registry.forEach((element) => {
          const gfx = registry.getGraphics(element) as SVGGElement | undefined;
          if (!gfx) return;

          const visual = gfx.querySelector('.djs-visual > :first-child') as SVGElement | null;
          if (!visual) return;

          originalColors.current[element.id] = visual.style.fill || visual.getAttribute('fill') || '';
        });

        const { preselectedElementIds } = props;
        if (!preselectedElementIds || preselectedElementIds.length === 0) {
          return;
        }

        const preselectedElements = registry
          .filter((element) => preselectedElementIds.includes(element.id))
          .sort((a, b) => preselectedElementIds.indexOf(a.id) - preselectedElementIds.indexOf(b.id));

        viewer.get<Selection>('selection').select(preselectedElements ?? []);
      })
      .catch((err) => {
        console.error(`[@5minds/processcube_app_sdk:BPMNViewer]\t\tError while importing BPMN XML: "${err.message}`);
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
