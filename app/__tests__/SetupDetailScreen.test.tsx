import { render, screen } from '@testing-library/react-native';
import { SetupDetailScreen } from '@/screens/SetupDetailScreen';
import { mockSetups } from '@/mocks/setups';

jest.mock('expo-video', () => ({
  useVideoPlayer: () => ({}),
  VideoView: () => null,
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
}));

jest.mock('@/auth/useAuth', () => ({
  useAuth: () => ({ session: { user: { id: 'buyer-1' } }, loading: false }),
}));

jest.mock('@/hooks/usePurchase', () => ({
  usePurchase: () => ({ purchase: null, loading: false, refetch: jest.fn() }),
}));

describe('SetupDetailScreen', () => {
  const setup = mockSetups[0];

  it('renders setup full description', () => {
    render(<SetupDetailScreen setup={setup} />);
    expect(screen.getByText(setup.description)).toBeTruthy();
  });

  it('renders price button text', () => {
    render(<SetupDetailScreen setup={setup} />);
    expect(screen.getByText(/29,00 €/)).toBeTruthy();
  });

  it('renders creator bio', () => {
    render(<SetupDetailScreen setup={setup} />);
    expect(screen.getByText(setup.creator.bio)).toBeTruthy();
  });

  it('renders tags', () => {
    render(<SetupDetailScreen setup={setup} />);
    setup.tags.forEach((tag) => {
      expect(screen.getByText(`#${tag}`)).toBeTruthy();
    });
  });
});
