import { render, screen, fireEvent } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SignInScreen } from '@/screens/SignInScreen';
import { supabase } from '@/services/supabase';

jest.mock('@/services/supabase', () => ({
  supabase: { auth: { signInWithPassword: jest.fn() } },
}));

const mockSignIn = supabase.auth.signInWithPassword as jest.Mock;

function renderWithNav(component: React.ReactElement) {
  return render(<NavigationContainer>{component}</NavigationContainer>);
}

describe('SignInScreen', () => {
  beforeEach(() => {
    mockSignIn.mockClear();
    mockSignIn.mockResolvedValue({ error: null });
  });

  it('renders title', () => {
    renderWithNav(<SignInScreen />);
    expect(screen.getByText(/Anmelden/i)).toBeTruthy();
  });

  it('calls supabase signInWithPassword on submit', () => {
    renderWithNav(<SignInScreen />);
    fireEvent.changeText(screen.getByLabelText('signin-email'), 'sicci@test.de');
    fireEvent.changeText(screen.getByLabelText('signin-password'), 'password123');
    fireEvent.press(screen.getByLabelText('signin-submit'));
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'sicci@test.de',
      password: 'password123',
    });
  });
});
