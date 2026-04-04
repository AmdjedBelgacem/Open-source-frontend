import { render, screen } from '@testing-library/react';
import React from 'react';

function Hello() {
  return <div>Hello Test</div>;
}

test('sanity: renders a simple component', () => {
  render(<Hello />);
  expect(screen.getByText('Hello Test')).toBeInTheDocument();
});
