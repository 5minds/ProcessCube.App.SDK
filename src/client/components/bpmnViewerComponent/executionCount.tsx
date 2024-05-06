type ExecutionCountProps = {
  count: number;
};

export default function ExecutionCount(props: ExecutionCountProps) {
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
