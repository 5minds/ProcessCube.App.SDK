import React from 'react';

import { warnOnceForDeprecation } from '../../utils/warnOnceForDeprecation';

type ExecutionCountProps = {
  count: number;
};

/**
 * @deprecated
 */
export default function ExecutionCount(props: ExecutionCountProps) {
  warnOnceForDeprecation('ExecutionCount');
  const style = {
    width: 30,
  };

  if (props.count <= 1) {
    return null;
  }

  return (
    <div style={style} className="bpmn-element-overlay__below-item bpmn-element-overlay__below-item--execution-count">
      {props.count}
    </div>
  );
}
