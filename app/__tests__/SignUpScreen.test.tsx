import { render, screen, fireEvent } from '@testing-library/react-native';
import { SignUpScreen } from '@/screens/SignUpScreen';

jest.mock('@/services/supabase', () => ({
  supabase: { auth: { signUp: jest.fn(() => Promise.resolve({ error: null })) } },
}));

describe('SignUpScreen', () => {
  it('renders title', () => {
    render(<SignUpScreen />);
    expect(screen.getByText(/Konto erstellen/i)).toBeTruthy();
  });

  it('disables submit button when fields empty', () => {
    render(<SignUpScreen />);
    const button = screen.getByLabelText('signup-submit');
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('shows password mismatch error', () => {
    render(<SignUpScreen />);
    fireEvent.changeText(screen.getByLabelText('signup-email'), 'a@b.de');
    fireEvent.changeText(screen.getByLabelText('signup-username'), 'sicci');
    fireEvent.changeText(screen.getByLabelText('signup-displayname'), 'Sicci');
    fireEvent.changeText(screen.getByLabelText('signup-password'), 'password123');
    fireEvent.changeText(screen.getByLabelText('signup-confirm'), 'different');
    fireEvent.press(screen.getByLabelText('signup-submit'));
    expect(screen.getByText(/Passwörter stimmen nicht überein/i)).toBeTruthy();
  });
});
