declare namespace JSX {
  interface IntrinsicElements {
    'wistia-player': {
      'media-id': string;
      seo?: string;
      aspect?: string;
      className?: string;
      children?: React.ReactNode;
    };
  }
}
