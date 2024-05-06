import React from 'react';

type SplitterPaneProps = React.PropsWithChildren<{
  vertical: boolean;
  primary: boolean;
  size: number;
  percentage: boolean;
}>;

type SplitterLayoutProps = React.PropsWithChildren<{
  customClassName: string;
  vertical: boolean;
  percentage: boolean;
  primaryIndex: number;
  primaryMinSize: number;
  secondaryMinSize: number;
  secondaryDefaultSize: number | null;
  secondaryInitialSize: number | null;
  onSecondaryPaneSizeChange: ((current: number) => void) | null;
  onDragStart: ((prev: number, current: number) => void) | null;
  onDragEnd: ((prev: number, current: number) => void) | null;
  initMediator?: ((instance: SplitterLayout) => void) | null;
}>;

type SplitterLayoutState = {
  lastMouseDown: number;
  secondaryPaneSize: number;
  resizing: boolean;
  size?: number;
};

type Position = {
  left: number;
  top: number;
};

type Rectange = Position & {
  width: number;
  height: number;
};

const DEFAULT_SPLITTER_SIZE = 4;

export class SplitterLayout extends React.Component<SplitterLayoutProps, SplitterLayoutState> {
  public static defaultProps: SplitterLayoutProps = {
    customClassName: '',
    vertical: false,
    percentage: false,
    primaryIndex: 0,
    primaryMinSize: 0,
    secondaryDefaultSize: null,
    secondaryInitialSize: null,
    secondaryMinSize: 0,
    onDragStart: null,
    onDragEnd: null,
    onSecondaryPaneSizeChange: null,
    children: [],
    initMediator: null,
  };

  private container: any;
  private splitter: any;

  constructor(props: SplitterLayoutProps) {
    super(props);
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleSplitterMouseDown = this.handleSplitterMouseDown.bind(this);
    this.handleSplitterDoubleClick = this.handleSplitterDoubleClick.bind(this);
    console.log('constructor props.secondaryInitialSize', props.secondaryInitialSize);
    this.state = {
      lastMouseDown: 0,
      secondaryPaneSize: props.secondaryInitialSize || 0,
      resizing: false,
    };

    if (props.initMediator != null) {
      props.initMediator(this);
    }
  }

  componentDidMount(): void {
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('mouseup', this.handleMouseUp);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('touchend', this.handleMouseUp);
    document.addEventListener('touchmove', this.handleTouchMove);
    document.addEventListener('dblclick', this.handleSplitterDoubleClick);

    let secondaryPaneSize;
    if (this.props.secondaryInitialSize) {
      secondaryPaneSize = this.props.secondaryInitialSize;
    } else {
      const containerRect = this.container.getBoundingClientRect();
      let splitterRect;
      if (this.splitter) {
        splitterRect = this.splitter.getBoundingClientRect();
      } else {
        // Simulate a splitter
        splitterRect = { width: DEFAULT_SPLITTER_SIZE, height: DEFAULT_SPLITTER_SIZE };
      }
      secondaryPaneSize = this.getSecondaryPaneSize(
        containerRect,
        splitterRect,
        {
          left: containerRect.left + (containerRect.width - splitterRect.width) / 2,
          top: containerRect.top + (containerRect.height - splitterRect.height) / 2,
        },
        false,
      );
    }
    this.setSecondaryPaneSize(secondaryPaneSize);
  }

  componentDidUpdate(_prevProps: SplitterLayoutProps, prevState: SplitterLayoutState): void {
    if (prevState.secondaryPaneSize !== this.state.secondaryPaneSize && this.props.onSecondaryPaneSizeChange) {
      this.props.onSecondaryPaneSizeChange(this.state.secondaryPaneSize);
    }

    if (prevState.resizing !== this.state.resizing) {
      if (this.state.resizing) {
        if (this.props.onDragStart) {
          this.props.onDragStart(prevState.secondaryPaneSize, this.state.secondaryPaneSize);
        }
      } else if (this.props.onDragEnd) {
        this.props.onDragEnd(prevState.secondaryPaneSize, this.state.secondaryPaneSize);
      }
    }
  }

  componentWillUnmount(): void {
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('touchend', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('dblclick', this.handleSplitterDoubleClick);
  }

  private clearSelection(): void {
    if ((document.body as any).createTextRange) {
      // https://github.com/zesik/react-splitter-layout/issues/16
      // https://stackoverflow.com/questions/22914075/#37580789
      const range = (document.body as any).createTextRange();
      range.collapse();
      range.select();
    } else if (window.getSelection) {
      const selection = window.getSelection();
      if (selection == null) {
        return;
      }

      if (selection.empty) {
        selection.empty();
      } else if (selection.removeAllRanges) {
        selection.removeAllRanges();
      }
    } else if ((document as any).selection) {
      (document as any).selection.empty();
    }
  }

  private getSecondaryPaneSize(
    containerRect: Rectange,
    splitterRect: Rectange,
    clientPosition: Position,
    offsetMouse: boolean,
  ): number {
    let totalSize = 0;
    let splitterSize = 0;
    let offset = 0;
    if (this.props.vertical) {
      totalSize = containerRect.height;
      splitterSize = splitterRect.height;
      offset = clientPosition.top - containerRect.top;
    } else {
      totalSize = containerRect.width;
      splitterSize = splitterRect.width;
      offset = clientPosition.left - containerRect.left;
    }
    if (offsetMouse) {
      offset -= splitterSize / 2;
    }
    if (offset < 0) {
      offset = 0;
    } else if (offset > totalSize - splitterSize) {
      offset = totalSize - splitterSize;
    }

    let secondaryPaneSize;
    if (this.props.primaryIndex === 1) {
      secondaryPaneSize = offset;
    } else {
      secondaryPaneSize = totalSize - splitterSize - offset;
    }
    let primaryPaneSize = totalSize - splitterSize - secondaryPaneSize;
    if (this.props.percentage) {
      secondaryPaneSize = (secondaryPaneSize * 100) / totalSize;
      primaryPaneSize = (primaryPaneSize * 100) / totalSize;
      splitterSize = (splitterSize * 100) / totalSize;
      totalSize = 100;
    }

    if (primaryPaneSize < this.props.primaryMinSize) {
      secondaryPaneSize = Math.max(secondaryPaneSize - (this.props.primaryMinSize - primaryPaneSize), 0);
    } else if (secondaryPaneSize < this.props.secondaryMinSize) {
      secondaryPaneSize = Math.min(totalSize - splitterSize - this.props.primaryMinSize, this.props.secondaryMinSize);
    }

    return secondaryPaneSize;
  }

  setSecondaryPaneSize(secondaryPaneSize: number): void {
    this.setState({ secondaryPaneSize });
  }

  maximizeSecondaryPane(): void {
    if (this.props.percentage) {
      this.setSecondaryPaneSize(100 - this.props.primaryMinSize);
    } else {
      throw new Error('maximizeSecondaryPane() is only supported in SplitterLayout with prop `percentage`');
    }
  }

  secondaryPaneIsMinimizedToDefault(): boolean {
    const secondaryPaneSize = this.props.secondaryDefaultSize || this.props.secondaryMinSize;

    return this.state.secondaryPaneSize === secondaryPaneSize;
  }

  minimizeSecondaryPaneToDefault(): void {
    const secondaryPaneSize = this.props.secondaryDefaultSize || this.props.secondaryMinSize;

    this.setSecondaryPaneSize(secondaryPaneSize);
  }

  private handleResize(): void {
    if (this.splitter && !this.props.percentage) {
      const containerRect = this.container.getBoundingClientRect();
      const splitterRect = this.splitter.getBoundingClientRect();
      const secondaryPaneSize = this.getSecondaryPaneSize(
        containerRect,
        splitterRect,
        {
          left: splitterRect.left,
          top: splitterRect.top,
        },
        false,
      );
      this.setState({ secondaryPaneSize });
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.state.resizing) {
      const containerRect = this.container.getBoundingClientRect();
      const splitterRect = this.splitter.getBoundingClientRect();
      const secondaryPaneSize = this.getSecondaryPaneSize(
        containerRect,
        splitterRect,
        {
          left: e.clientX,
          top: e.clientY,
        },
        true,
      );
      this.clearSelection();
      this.setState({ secondaryPaneSize });
    }
  }

  private handleTouchMove(e: any): void {
    this.handleMouseMove(e.changedTouches[0]);
  }

  private handleSplitterMouseDown(event: React.MouseEvent | React.TouchEvent): void {
    event.preventDefault();
    this.clearSelection();
    this.setState({ resizing: true });
  }

  private handleSplitterDoubleClick(): void {
    console.log('this.props.secondaryDefaultSize', this.props.secondaryDefaultSize);
    console.log('this.props.secondaryMinSize', this.props.secondaryMinSize);
    const secondaryPaneSize = this.props.secondaryDefaultSize || this.props.secondaryMinSize;
    console.log('secondaryPaneSize', secondaryPaneSize);

    if (this.state.secondaryPaneSize === secondaryPaneSize) {
      this.setSecondaryPaneSize(Math.floor(secondaryPaneSize * 1.5));
    } else {
      this.setSecondaryPaneSize(secondaryPaneSize);
    }
  }

  private handleMouseUp(): void {
    this.setState((prevState: SplitterLayoutState) => (prevState.resizing ? { resizing: false } : null));
  }

  render(): JSX.Element {
    let containerClasses = 'splitter-layout';
    if (this.props.customClassName) {
      containerClasses += ` ${this.props.customClassName}`;
    }
    if (this.props.vertical) {
      containerClasses += ' splitter-layout-vertical';
    }
    if (this.state.resizing) {
      containerClasses += ' layout-changing';
    }

    const children = React.Children.toArray(this.props.children).slice(0, 2);
    if (children.length === 0) {
      children.push(<div />);
    }
    const wrappedChildren: JSX.Element[] = [];
    const primaryIndex = this.props.primaryIndex !== 0 && this.props.primaryIndex !== 1 ? 0 : this.props.primaryIndex;
    for (let i = 0; i < children.length; ++i) {
      let primary = true;
      let size: number | undefined = undefined;
      if (children.length > 1 && i !== primaryIndex) {
        primary = false;
        size = this.state.secondaryPaneSize;
      }
      wrappedChildren.push(
        <SplitterPane vertical={this.props.vertical} percentage={this.props.percentage} primary={primary} size={size!}>
          {children[i]}
        </SplitterPane>,
      );
    }

    return (
      <div
        className={containerClasses}
        ref={(c) => {
          this.container = c;
        }}
      >
        {wrappedChildren[0]}
        {wrappedChildren.length > 1 && (
          <div role="separator" className="layout-splitter">
            <div
              className="layout-splitter__inner"
              ref={(c) => {
                this.splitter = c;
              }}
              onMouseDown={this.handleSplitterMouseDown}
              onTouchStart={this.handleSplitterMouseDown}
            ></div>
          </div>
        )}
        {wrappedChildren.length > 1 && wrappedChildren[1]}
      </div>
    );
  }
}

function SplitterPane(
  props: SplitterPaneProps = {
    vertical: false,
    primary: false,
    size: 0,
    percentage: false,
    children: [],
  },
): JSX.Element {
  const size = props.size || 0;
  const unit = props.percentage ? '%' : 'px';
  let classes = 'layout-pane';
  const style: React.CSSProperties = {};
  if (!props.primary) {
    if (props.vertical) {
      style.height = `${size}${unit}`;
    } else {
      style.width = `${size}${unit}`;
    }
  } else {
    classes += ' layout-pane-primary';
  }
  return (
    <div className={classes} style={style}>
      {props.children}
    </div>
  );
}
