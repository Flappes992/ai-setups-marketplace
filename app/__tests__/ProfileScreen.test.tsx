import { render, screen, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ProfileScreen } from '@/screens/ProfileScreen';

function renderWithNav(component: React.ReactElement) {
  return render(<NavigationContainer>{component}</NavigationContainer>);
}

jest.mock('@/services/supabase', () => ({
  supabase: {
    auth: { signOut: jest.fn() },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({
              data: {
                id: 'u1',
                username: 'sicci',
                display_name: 'Sicci',
                avatar_url: null,
                bio: null,
                rating_average: 0,
                setups_count: 0,
                created_at: '2026-05-29T10:00:00Z',
              },
              error: null,
            }),
          ),
        })),
      })),
    })),
  },
}));

jest.mock('@/auth/useAuth', () => ({
  useAuth: () => ({
    session: { user: { id: 'u1', email: 'sicci@test.de' } },
    loading: false,
  }),
}));

jest.mock('@/hooks/useMySetups', () => ({
  useMySetups: () => ({ setups: [], loading: false, error: null, refetch: jest.fn() }),
}));

jest.mock('@/hooks/useSavedSetups', () => ({
  useSavedSetups: () => ({ setups: [], loading: false, error: null, refetch: jest.fn() }),
}));

jest.mock('@/hooks/useLikedSetups', () => ({
  useLikedSetups: () => ({ setups: [], loading: false, error: null, refetch: jest.fn() }),
}));

jest.mock('@/hooks/useMyPurchases', () => ({
  useMyPurchases: () => ({ items: [], loading: false, error: null, refetch: jest.fn() }),
}));

describe('ProfileScreen', () => {
  it('renders username after profile loads', async () => {
    renderWithNav(<ProfileScreen />);
    await waitFor(() => {
      expect(screen.getByLabelText('open-settings')).toBeTruthy();
    });
  });

  it('renders edit-profile button', async () => {
    renderWithNav(<ProfileScreen />);
    await waitFor(() => {
      expect(screen.getByLabelText('edit-profile')).toBeTruthy();
    });
  });
});
