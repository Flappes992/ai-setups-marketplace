import { render, screen } from '@testing-library/react-native';
import { SetupCard } from '@/components/SetupCard';
import { mockSetups } from '@/mocks/setups';

jest.mock('@/hooks/useToggleLike', () => ({
  useToggleLike: () => ({ liked: false, count: 0, loading: false, toggle: jest.fn() }),
}));

jest.mock('@/hooks/useToggleSave', () => ({
  useToggleSave: () => ({ saved: false, loading: false, toggle: jest.fn() }),
}));

describe('SetupCard', () => {
  it('renders setup title', () => {
    render(<SetupCard setup={mockSetups[0]} />);
    expect(screen.getByText('Cold-Email Automation mit Claude')).toBeTruthy();
  });

  it('renders creator username', () => {
    render(<SetupCard setup={mockSetups[0]} />);
    expect(screen.getByText(/@lukas_ai/i)).toBeTruthy();
  });

  it('renders formatted price', () => {
    render(<SetupCard setup={mockSetups[0]} />);
    expect(screen.getByText('29,00 €')).toBeTruthy();
  });
});
