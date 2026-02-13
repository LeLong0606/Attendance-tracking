import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Error Boundary] Caught an error:', error);
    console.error('[Error Boundary] Error Info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });

    // Store error info in sessionStorage for error page to access
    sessionStorage.setItem('lastError', JSON.stringify({
      code: '500',
      message: error?.message || 'Có lỗi xảy ra trong ứng dụng',
      details: errorInfo?.componentStack || error?.stack || '',
    }));
  }

  render() {
    if (this.state.hasError) {
      // Redirect to error page
      window.location.href = '/error';
      return null;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
