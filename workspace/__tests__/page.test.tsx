import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../app/page'; 
// Mock the 'fetch' API globally for the Jest environment.
// This is a general safeguard for any library that might use fetch (like Firebase).
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
) as jest.Mock;


jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../app/lib/firebase', () => ({
  db: {},
  auth: {},
  app: {},
}));

// Mock Firebase Auth functions directly
// Declare mockSignOut using 'let' so it can be initialized in beforeEach
let mockSignOut: jest.Mock;
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signOut: (...args: any[]) => mockSignOut(...args), // Use the captured mockSignOut here
}));


let mockCurrentUser: any = null;
let mockLoading: boolean = false;
let mockLogout: jest.Mock = jest.fn(() => Promise.resolve()); // Keeping this mockLogout for clarity, though not used by Navbar's direct signOut call

jest.mock('../app/context/AuthContext', () => ({
  // eslint-disable-next-line react/display-name
  AuthContextProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    currentUser: mockCurrentUser,
    loading: mockLoading,
    logout: mockLogout, // This mock is not directly called by Navbar's handleLogout
  }),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    // Add other common properties that useRouter might expect, even if not directly used by Navbar
    pathname: '/',
    query: {},
    asPath: '/',
    isReady: true,
  })),
  // Also mock other hooks if your components directly import them from 'next/navigation'
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));




describe('Home Component', () => {
  // Clear mocks and reset mock states before each test to ensure isolation
  beforeEach(() => {
    // Initialize mockSignOut here to ensure it's defined before any test runs
    mockSignOut = jest.fn(() => Promise.resolve());

    mockCurrentUser = null;
    mockLoading = false;
    mockLogout.mockClear(); // Clear mockLogout for completeness, even if not directly asserted
    mockPush.mockClear();
    mockSignOut.mockClear(); // Clear the actual signOut mock
    (global.fetch as jest.Mock).mockClear();
    (require('next/navigation').useRouter as jest.Mock).mockClear();
    (require('next/navigation').usePathname as jest.Mock).mockClear();
    (require('next/navigation').useSearchParams as jest.Mock).mockClear();
  });

  // Test case 1: Ensure the Navbar component is rendered
  test('renders the Navbar component', () => {
    render(<Home />);

 
    const brandLink = screen.getByRole('link', { name: /Wedding Wagers/i });
    expect(brandLink).toBeInTheDocument();

    const navbarElement = screen.getByRole('navigation');
    expect(navbarElement).toBeInTheDocument();
  });

  // Test case 2: Ensure "View All Bets" button/link (main content) is rendered and clickable
  test('renders "View All Bets" link and it is clickable', () => {
    render(<Home />);

    // Find the link by its accessible name (the text content)
    const viewAllBetsLink = screen.getByRole('link', { name: /View All Bets/i });

    // Assert that the link is in the document
    expect(viewAllBetsLink).toBeInTheDocument();

    // Assert that the link has the correct href attribute
    expect(viewAllBetsLink).toHaveAttribute('href', '/bets');
  });

  // Test case 3: Ensure "Learn More" button/link (main content) is rendered and clickable
  test('renders "Learn More" link and it is clickable', () => {
    render(<Home />);

    // Find the link by its accessible name
    const learnMoreLink = screen.getByRole('link', { name: /Learn More/i });

    // Assert that the link is in the document
    expect(learnMoreLink).toBeInTheDocument();

    // Assert that the link has the correct href attribute
    expect(learnMoreLink).toHaveAttribute('href', '/about');
  });


  test('Navbar renders Home, Bets, About links', () => {
    render(<Home />);

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bets' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
  });

  test('Navbar renders Login button when not authenticated', () => {
    mockCurrentUser = null;
    mockLoading = false;
    render(<Home />);

    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  test('Navbar renders Logout button when authenticated and handles logout', async () => {
    mockCurrentUser = { uid: 'test-user-id', email: 'test@example.com' };
    mockLoading = false;
    render(<Home />);

    const logoutButton = screen.getByRole('button', { name: 'Logout' });
    expect(logoutButton).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();

    fireEvent.click(logoutButton);

    await waitFor(() => {
      // Assert that the directly imported signOut from 'firebase/auth' was called
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  test('Navbar renders loading state for auth', () => {
    mockLoading = true;
    render(<Home />);

   
    expect(screen.queryByRole('link', { name: 'Login' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();

  });
});
