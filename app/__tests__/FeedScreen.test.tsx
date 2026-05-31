import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { FeedScreen } from '@/screens/FeedScreen';
import { useSetups } from '@/hooks/useSetups';

jest.mock('@/hooks/useSetups', () => ({
  useSetups: jest.fn(),
}));

jest.mock('@/hooks/useToggleLike', () => ({
  useToggleLike: () => ({ liked: false, count: 0, loading: false, toggle: jest.fn() }),
}));

jest.mock('@/hooks/useToggleSave', () => ({
  useToggleSave: () => ({ saved: false, loading: false, toggle: jest.fn() }),
}));

const mockUseSetups = useSetups as jest.Mock;

function renderWithNav(component: React.ReactElement) {
  return render(<NavigationContainer>{component}</NavigationContainer>);
}

describe('FeedScreen', () => {
  it('shows loading state', () => {
    mockUseSetups.mockReturnValue({ setups: [], loading: true, error: null, refetch: jest.fn() });
    renderWithNav(<FeedScreen />);
    expect(screen.getByLabelText('open-profile')).toBeTruthy();
  });

  it('shows empty state when no setups', () => {
    mockUseSetups.mockReturnValue({ setups: [], loading: false, error: null, refetch: jest.fn() });
    renderWithNav(<FeedScreen />);
    expect(screen.getByText(/Noch keine Setups/i)).toBeTruthy();
  });

  it('shows error state', () => {
    mockUseSetups.mockReturnValue({
      setups: [],
      loading: false,
      error: new Error('Network failed'),
      refetch: jest.fn(),
    });
    renderWithNav(<FeedScreen />);
    expect(screen.getByText(/Network failed/i)).toBeTruthy();
  });
});
