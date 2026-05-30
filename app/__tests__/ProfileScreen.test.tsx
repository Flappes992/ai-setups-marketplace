import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { supabase } from '@/services/supabase';

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

describe('ProfileScreen', () => {
  it('renders logout button', () => {
    renderWithNav(<ProfileScreen />);
    expect(screen.getByLabelText('profile-logout')).toBeTruthy();
  });

  it('calls supabase signOut when logout pressed', () => {
    renderWithNav(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText('profile-logout'));
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
