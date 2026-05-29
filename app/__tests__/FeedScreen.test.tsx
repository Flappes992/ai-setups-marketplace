import { render, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { FeedScreen } from '@/screens/FeedScreen';

function renderWithNav(component: React.ReactElement) {
  return render(<NavigationContainer>{component}</NavigationContainer>);
}

describe('FeedScreen', () => {
  it('renders at least one setup from mock data', () => {
    renderWithNav(<FeedScreen />);
    expect(screen.getByText('Cold-Email Automation mit Claude')).toBeTruthy();
  });

  it('renders multiple setups', () => {
    renderWithNav(<FeedScreen />);
    expect(screen.getByText('Cold-Email Automation mit Claude')).toBeTruthy();
    expect(screen.getByText('Daily-Standup-Bot für Discord')).toBeTruthy();
  });
});
