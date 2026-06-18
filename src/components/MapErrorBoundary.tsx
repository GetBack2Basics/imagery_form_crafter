import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export class MapErrorBoundary extends Component<Props, { hasError: boolean }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('MapCanvas boundary caught', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full">
          <div className="flex h-full items-center justify-center">
            <div className="rounded-md border border-white/20 bg-black/60 p-4 text-sm text-white/80 backdrop-blur-md">
              Map runtime unavailable. The rest of the app remains usable.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
