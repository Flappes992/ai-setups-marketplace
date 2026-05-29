import { render, screen } from '@testing-library/react-native';
import { FeedScreen } from '@/screens/FeedScreen';

describe('FeedScreen', () => {
  it('renders at least one setup from mock data', () => {
    render(<FeedScreen />);
    expect(screen.getByText('Cold-Email Automation mit Claude')).toBeTruthy();
  });

  it('renders multiple setups', () => {
    render(<FeedScreen />);
    expect(screen.getByText('Cold-Email Automation mit Claude')).toBeTruthy();
    expect(screen.getByText('Daily-Standup-Bot für Discord')).toBeTruthy();
  });
});
