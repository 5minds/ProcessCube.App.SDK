import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';
import type { OverlayAttrs } from 'diagram-js/lib/features/overlays/Overlays';
import type { ElementLike } from 'diagram-js/lib/model/Types';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import React from 'react';

import { BPMNViewer, BPMNViewerFunctions } from './BPMNViewer';
import { DocumentationViewer } from './DocumentationViewer';
import { SplitterLayout } from './SplitterLayout';

const DEFAULT_SPLITTER_SIZE = 30;

export function DiagramDocumentationInspector(props: { xml: string }) {
  const bpmnViewerRef = useRef<BPMNViewerFunctions>(null);
  const splitterRef = useRef<SplitterLayout>(null);
  const [selectedElements, setSelectedElements] = useState<Array<ElementLike>>([]);
  const [bpmnRendered, setBpmnRendered] = useState(false);
  const [preselectedElementIds, setPreselectedElementIds] = useState<string[]>([]);
  const [splitterSize, setSplitterSize] = useState(DEFAULT_SPLITTER_SIZE);

  useEffect(() => {
    if (!window) {
      return;
    }

    // Not using the useSearchParams hook, because the component should be able to run in non-Next.js environments
    const searchParams = new URLSearchParams(window.location.search);
    const elementIds = searchParams.getAll('selected');
    setPreselectedElementIds(elementIds);

    if (!searchParams.has('splitterSize')) {
      return;
    }

    const splitterSize = parseFloat(searchParams.get('splitterSize')!);
    if (isNaN(splitterSize) || splitterSize === DEFAULT_SPLITTER_SIZE) {
      return;
    }

    setSplitterSize(splitterSize);
    splitterRef.current?.setSecondaryPaneSize(splitterSize);
  }, []);

  useEffect(() => {
    if (!bpmnRendered) {
      return;
    }

    const searchParams = new URLSearchParams(window.location.search);

    if (splitterSize !== DEFAULT_SPLITTER_SIZE) {
      searchParams.set('splitterSize', splitterSize.toString());
    } else {
      searchParams.delete('splitterSize');
    }

    searchParams.delete('selected');
    if (selectedElements.length > 0) {
      selectedElements.forEach((element) => searchParams.append('selected', element.id));
    }

    const decodedURIHash = decodeURIComponent(window.location.hash.slice(1));
    const headingElement = decodedURIHash.length > 0 ? document.getElementById(decodedURIHash) : null;

    // Not using the useRouter hook, because the component should be able to run in non-Next.js environments
    window.history.replaceState(null, '', `?${searchParams.toString()}${headingElement ? window.location.hash : ''}`);
    window.location.hash && (window.location.hash = window.location.hash); // Seems stupid, but is needed to trigger a hashchange event
  }, [selectedElements, splitterSize]);

  useEffect(() => {
    const overlays = bpmnViewerRef.current?.getOverlays();
    const registry = bpmnViewerRef.current?.getElementRegistry();
    const documentatedElements = registry?.filter(filterElementsWithDocumentation);

    documentatedElements?.forEach((element) => {
      const position = getOverlayPosition(element);

      overlays?.add(element.id, {
        position: position,
        html: '<div title="This element has documentation" class="app-sdk-bg-[color:var(--asdk-ddi-background-color)] app-sdk-p-[2px] app-sdk-rounded-s"><svg xmlns="http://www.w3.org/2000/svg" height=17 viewBox="0 0 448 512"><!--!Font Awesome Pro 6.5.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc.--><path d="M64 0C28.7 0 0 28.7 0 64L0 448l0 0c0 35.3 28.7 64 64 64H432c8.8 0 16-7.2 16-16s-7.2-16-16-16H416V413.3c18.6-6.6 32-24.4 32-45.3V48c0-26.5-21.5-48-48-48H64zM384 416v64H64c-17.7 0-32-14.3-32-32s14.3-32 32-32H384zM64 384c-11.7 0-22.6 3.1-32 8.6L32 64c0-17.7 14.3-32 32-32H96V384H64zm64 0V32H400c8.8 0 16 7.2 16 16V368c0 8.8-7.2 16-16 16H128zm48-240c0 8.8 7.2 16 16 16H352c8.8 0 16-7.2 16-16s-7.2-16-16-16H192c-8.8 0-16 7.2-16 16zm0 96c0 8.8 7.2 16 16 16H352c8.8 0 16-7.2 16-16s-7.2-16-16-16H192c-8.8 0-16 7.2-16 16z"/></svg></div>',
      });
    });
  }, [bpmnRendered]);

  return (
    <SplitterLayout
      ref={splitterRef}
      vertical
      percentage
      secondaryInitialSize={DEFAULT_SPLITTER_SIZE}
      secondaryDefaultSize={DEFAULT_SPLITTER_SIZE}
      onDragEnd={(_prev: number, current: number) => setSplitterSize(Math.round(current))}
    >
      <BPMNViewer
        ref={bpmnViewerRef}
        xml={props.xml}
        preselectedElementIds={preselectedElementIds}
        onSelectionChanged={(elements) => setSelectedElements([...elements])}
        onImportDone={() => setBpmnRendered(true)}
      />
      <div className="app-sdk-flex app-sdk-justify-center app-sdk-h-full app-sdk-scroll-shadow app-sdk-bg-[color:var(--asdk-ddi-background-color)]">
        <DocumentationText elements={selectedElements} />
      </div>
    </SplitterLayout>
  );
}

function DocumentationText({ elements }: { elements: Array<ElementLike> }) {
  if (elements.length === 0) {
    return <p className="app-sdk-m-0 app-sdk-p-6">Please select an element</p>;
  }

  if (elements.length === 1) {
    const text: string = getBusinessObject(elements[0])?.documentation?.[0]?.text;
    if (text != null && text.trim() !== '') {
      return <DocumentationViewer documentation={text} />;
    }

    return <p className="app-sdk-m-0 app-sdk-p-6">No documentation available</p>;
  }

  return (
    <DocumentationViewer
      documentation={elements
        .map((element) => getBusinessObject(element)?.documentation?.[0]?.text)
        .join('\n\n<hr />\n\n')}
    />
  );
}

const HIDE_DOCUMENTATION_OVERLAY_FOR_BPMN_TYPES: string[] = [
  'bpmn:DataInputAssociation',
  'bpmn:DataOutputAssociation',
  'bpmn:SequenceFlow',
  'label',
];

const DOCUMENTATION_OVERLAYS_POSITION: Record<string, OverlayAttrs['position']> = {
  DEFAULT: {
    top: 3,
    right: 22,
  },
  PARTICIPANT: {
    top: 3,
    left: 3,
  },
  ANNOTATION: {
    bottom: 10,
    left: 10,
  },
  GATEWAY: {
    bottom: 17,
    right: 17,
  },
  OTHER: {
    bottom: 12,
    right: 12,
  },
} as const;

const getOverlayPosition = (element: ElementLike) => {
  if (
    element.type.endsWith('Task') ||
    element.type === 'bpmn:CallActivity' ||
    element.type === 'bpmn:Collaboration' ||
    element.type === 'bpmn:Group' ||
    element.type === 'bpmn:Lane' ||
    element.type === 'bpmn:SubProcess'
  ) {
    return DOCUMENTATION_OVERLAYS_POSITION.DEFAULT;
  } else if (element.type === 'bpmn:Participant') {
    return DOCUMENTATION_OVERLAYS_POSITION.PARTICIPANT;
  } else if (element.type.endsWith('Gateway')) {
    return DOCUMENTATION_OVERLAYS_POSITION.GATEWAY;
  } else if (element.type === 'bpmn:TextAnnotation') {
    return DOCUMENTATION_OVERLAYS_POSITION.ANNOTATION;
  }

  return DOCUMENTATION_OVERLAYS_POSITION.OTHER;
};

const filterElementsWithDocumentation = (element: ElementLike) => {
  if (HIDE_DOCUMENTATION_OVERLAY_FOR_BPMN_TYPES.includes(element.type)) {
    return false;
  }
  const businessObject = getBusinessObject(element);
  const documentation = businessObject?.documentation?.[0]?.text;
  return documentation != null && documentation.trim() !== '';
};

export const DiagramDocumentationInspectorNextJS = dynamic(() => Promise.resolve(DiagramDocumentationInspector), {
  ssr: false,
});
