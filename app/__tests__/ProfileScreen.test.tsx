import { render, screen, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { supabase } from '@/services/supabase';

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
    render(<ProfileScreen />);
    expect(screen.getByLabelText('profile-logout')).toBeTruthy();
  });

  it('calls supabase signOut when logout pressed', () => {
    render(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText('profile-logout'));
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
