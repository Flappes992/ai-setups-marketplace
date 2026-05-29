import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SetupCard } from '@/components/SetupCard';
import { mockSetups } from '@/mocks/setups';

describe('SetupCard', () => {
  it('renders setup title', () => {
    render(<SetupCard setup={mockSetups[0]} />);
    expect(screen.getByText('Cold-Email Automation mit Claude')).toBeTruthy();
  });

  it('renders creator display name', () => {
    render(<SetupCard setup={mockSetups[0]} />);
    expect(screen.getByText('Lukas')).toBeTruthy();
  });

  it('renders formatted price', () => {
    render(<SetupCard setup={mockSetups[0]} />);
    expect(screen.getByText('29,00 €')).toBeTruthy();
  });
});
