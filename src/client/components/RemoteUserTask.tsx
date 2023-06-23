type RemoteUserTaskProps = {
  url: string;
};

export function RemoteUserTask(props: RemoteUserTaskProps) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <iframe width="100%" height="100%" src={props.url}></iframe>
    </div>
  );
}
