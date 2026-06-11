import React from 'react';
import { render, screen } from '@testing-library/react';

test('renders a simple element to verify testing framework mounts correctly', () => {
  render(<div>OrtakSepet App</div>);
  const element = screen.getByText(/OrtakSepet/i);
  expect(element).toBeInTheDocument();
});
