import React from 'react';

import { FlowNodeInstance } from '@5minds/processcube_engine_sdk';

import { BottomButton } from './BottomButton';
import { OpenButton } from './OpenButton';
import { PlayButton } from './PlayButton';

type BottomButtonContainer = {
  width: number;
  flowNodeInstances: FlowNodeInstance[];
  showExecutionCount: boolean;
  showPlayButton: boolean;
  showGoToButton: boolean;
  instancesToGoTo: FlowNodeInstance[];
  handlePlay: (flowNodeInstanceId: string, flowNodeType: string) => void;
  handleGoTo: (flowNodeInstances: FlowNodeInstance[]) => void;
};

export function BottomButtonContainer({
  width,
  flowNodeInstances,
  showExecutionCount,
  showPlayButton,
  showGoToButton,
  instancesToGoTo: goToInstances,
  handlePlay,
  handleGoTo,
}: BottomButtonContainer) {
  return (
    <div className={`app-sdk-flex app-sdk-gap-1 app-sdk-justify-center`} style={{ width: `${width}px` }}>
      {showExecutionCount && <BottomButton>{flowNodeInstances.length}</BottomButton>}
      {showGoToButton && goToInstances.length > 0 && <OpenButton onClick={() => handleGoTo(goToInstances)} />}
      {showPlayButton && (
        <PlayButton
          onClick={() => handlePlay(flowNodeInstances[0].flowNodeInstanceId, flowNodeInstances[0].flowNodeType)}
        />
      )}
    </div>
  );
}
